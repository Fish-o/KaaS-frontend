import { nanoid } from "nanoid";
import Pusher, { Channel } from "pusher-js";
import { Variable } from "./Actions";
import { EventObject, performEvent } from "./Events";
import {
  bindEvents,
  bindHostEvents,
  checkAlive,
  LobbyInfo,
} from "../networking";
import { Card } from "./Objects/Card";
import { Deck } from "./Objects/Deck";
import { Hand, Player } from "./Objects/Player";
import {
  GameObject,
  PlayerObject,
  resolveDecks,
  resolvePlayer,
} from "./Resolvers";
import _ from "lodash";
import { generateKeyPair, generateSymmetricKey } from "../crypto";
import { join_lobby } from "../networking/client/connect";

export enum GameState {
  Setup = "setup",
  InGame = "in-game",
  End = "end",
}

export function isValidVariableName(varName?: any): varName is Variable {
  if (!varName) return false;
  else if (typeof varName !== "string") return false;
  else if (varName.startsWith("$") && varName.length > 1) return true;
  return false;
}

type user_id = string;
export class Game {
  private _user_id: string;
  private _private_key: CryptoKey;
  private _public_key: CryptoKey;
  private _phone_book: Map<user_id, CryptoKey> = new Map();
  private _state: GameState;
  private _players: Player[];
  private _decks: Deck[];
  private _turn: number;
  private _turnPlayerIndex: number;
  private _turnDirection: "normal" | "reversed";
  private _events: Map<EventObject["type"], EventObject[]> = new Map();
  private _pusher: Pusher | undefined;

  private _lobbyHost: boolean = false;

  private _lobbyKey: CryptoKey | undefined;
  private _lobbyName: string | undefined;
  private _lobbyPassword: string | undefined;
  private _lobbyChannel: Channel | undefined;

  private _maxPlayerCount: number;
  private _minPlayerCount: number;

  constructor(
    private gameObject: GameObject,
    auth: { privateKey: CryptoKey; publicKey: CryptoKey },
    lobbyInfo?: LobbyInfo
  ) {
    this._user_id = lobbyInfo?.user_id || nanoid();

    const { privateKey, publicKey } = auth;

    this._private_key = privateKey;
    this._public_key = publicKey;
    this._turn = 1;
    this._turnPlayerIndex = 0;

    this._turnDirection = gameObject.settings.turnDirection;
    this._maxPlayerCount = gameObject.settings.maxPlayerCount;
    this._minPlayerCount = gameObject.settings.minPlayerCount;
    this._players = gameObject.players.map((p) => resolvePlayer(p));
    this._decks = resolveDecks(gameObject.decks);
    this._state = GameState.Setup;

    if (lobbyInfo) {
      this._pusher = lobbyInfo.pusher;
      this._lobbyChannel = lobbyInfo.lobby;
      this._lobbyHost = false;
      this._lobbyKey = lobbyInfo.key;
      this._lobbyName = lobbyInfo.name;
      this._lobbyPassword = lobbyInfo.password;
      bindEvents(this, this._lobbyChannel);
    }

    this.storeEvents(gameObject.events);
  }

  get user_id(): string {
    return this._user_id;
  }
  get is_host(): boolean {
    return this._lobbyHost;
  }
  get game_state(): GameState {
    return this._state;
  }
  get public_key(): CryptoKey {
    return this._public_key;
  }
  get private_key(): CryptoKey {
    return this._private_key;
  }
  get lobby_key(): CryptoKey {
    if (!this._lobbyKey)
      throw new Error("Lobby key not set, probably not connected yet");
    return this._lobbyKey;
  }
  get lobby_name(): string {
    if (!this._lobbyName)
      throw new Error("Lobby name not set, probably not connected yet");
    return this._lobbyName;
  }
  get lobby_password(): string {
    if (!this._lobbyPassword)
      throw new Error("Lobby name not set, probably not connected yet");
    return this._lobbyPassword;
  }
  get maxPlayerCount(): number {
    return this._maxPlayerCount;
  }
  get minPlayerCount(): number {
    return this._minPlayerCount;
  }

  get lobbyChannel(): Channel {
    if (!this._lobbyChannel) throw new Error("Lobby channel not set");
    return this._lobbyChannel;
  }

  addToPhoneBook(user_id: user_id, public_key: CryptoKey) {
    this._phone_book.set(user_id, public_key);
  }
  getFromPhoneBook(user_id: user_id): CryptoKey | undefined {
    return this._phone_book.get(user_id);
  }

  // Manage Players
  addPlayer(playerObject: PlayerObject): Player {
    if (this._state !== GameState.Setup)
      throw new Error("Cannot add player to game that is not in setup state");
    const player = resolvePlayer(playerObject);
    this._players.push(player);
    return player;
  }
  removePlayer(player: Player): void {
    if (this._state !== GameState.Setup)
      throw new Error(
        "Cannot remove player from game that is not in setup state"
      );
    this._players = this._players.filter((p) => p !== player);
  }

  getAllCards(): Card[] {
    const deck_cards = this._decks.reduce((acc, deck) => {
      return acc.concat(deck.cards);
    }, [] as Card[]);
    const player_cards = this._players.reduce((acc, player) => {
      return acc.concat(player.hand.cards);
    }, [] as Card[]);
    return deck_cards.concat(player_cards);
  }
  getAllPlayers(): readonly Player[] {
    return this._players;
  }
  getAllDecks(): readonly Deck[] {
    return this._decks;
  }
  getAllHands(): Hand[] {
    return this._players.map((p) => p.hand);
  }

  // Events
  private storeEvents(events: EventObject[]) {
    const eventsMaps: Map<EventObject["type"], EventObject[]> = new Map();
    for (let event of events)
      if (eventsMaps.has(event.type)) eventsMaps.get(event.type)!.push(event);
      else eventsMaps.set(event.type, [event]);
    this._events = eventsMaps;
  }
  getEventsFromType<T extends EventObject>(
    type: EventObject["type"]
  ): T[] | undefined {
    return this._events.get(type) as T[];
  }

  // Game lifecycle
  private init() {
    this._state = GameState.Setup;
    performEvent(
      {
        type: "event:game.init",
        data: {},
      },
      this
    );
  }
  static async init_client(
    lobbyName: string,
    lobbyPassword: string,
    playerName: string
  ) {
    const user_id = nanoid();
    const pusher = new Pusher("b84ab7e2e0b525e71529", {
      cluster: "eu",
      authEndpoint: "/api/pusher/auth",
    });
    const lobby = pusher.subscribe(`private-lobby-${lobbyName}`);
    await bindDefaults(lobby);
    const gameState = await checkAlive(user_id, lobby);
    if (gameState === GameState.InGame || gameState === GameState.End) {
      console.log(
        "[GAME/init_client]",
        "Lobby is alive, and has already started!!!!"
      );
      throw new Error("Lobby has already started");
    } else if (gameState !== GameState.Setup) {
      console.log("[GAME/init_client]", "Lobby dead, cant join");
      throw new Error("Lobby with that name does not exists");
    }

    // this._lobbyName = lobbyName;
    // this._lobbyPassword = lobbyPassword;
    // this._lobbyHost = false;
    const { privateKey, publicKey } = await generateKeyPair();
    const { lobby_key, gameObj } = await join_lobby(
      user_id,
      publicKey,
      privateKey,
      lobby,
      lobbyPassword,
      playerName
    );

    const game = new Game(
      gameObj,
      { privateKey, publicKey },
      {
        key: lobby_key,
        name: playerName,
        password: lobbyPassword,
        user_id: user_id,
        pusher,
        lobby,
      }
    );
    pusher.unbind();
    pusher.unbind_all();
    return game;
  }

  async init_host(
    lobbyName: string,
    lobbyPassword: string,
    playerName: string
  ) {
    if (this._state !== GameState.Setup || this._pusher)
      throw new Error("Game already initialized");
    const pusher = new Pusher("b84ab7e2e0b525e71529", {
      cluster: "eu",
      authEndpoint: "/api/pusher/auth",
    });
    console.log("[GAME/init_host]", "Creating lobby");
    const lobby = pusher.subscribe(`private-lobby-${lobbyName}`);
    console.log("[GAME/init_host]", "Created lobby", lobby.name);
    await bindDefaults(lobby);

    const gameState = await checkAlive(this.user_id, lobby);
    if (gameState === GameState.InGame || gameState === GameState.End) {
      console.log(
        "[GAME/init_host]",
        "Lobby is alive, and has already started!!!!"
      );
      throw new Error("Lobby with that name already exists");
    } else if (gameState === GameState.Setup) {
      console.log("[GAME/init_host]", "Lobby already alive, could join it");
      throw new Error("Lobby with that name already exists");
    }
    console.log("[GAME/init_host]", "Lobby dead! Creating lobby as host");

    this._pusher = pusher;
    this._lobbyChannel = lobby;
    this._lobbyChannel = lobby;
    this._lobbyHost = true;
    this._lobbyKey = await generateSymmetricKey();
    this._lobbyPassword = lobbyPassword;
    this._lobbyName = lobbyName;
    this.addPlayer({
      type: "object:player",
      object: {
        name: playerName,
        tags: [],
        user_id: this.user_id,
        hand: {
          type: "object:hand",
          object: {
            name: "hand",
            cards: [
              {
                type: "object:card",
                object: {
                  name: "host",
                  description: "a",
                  tags: [],
                },
              },
            ],
            tags: [],
          },
        },
      },
    });

    bindEvents(this, lobby);
    console.log(
      "[GAME/init_host]",
      "Created lobby",
      lobby.name,
      ", binding host events"
    );
    bindHostEvents(this, lobby);
  }

  disconnect() {
    console.log("[GAME/pusher]", "Disconnecting from Pusher...");
    this._pusher?.disconnect();
  }

  start() {
    if (this._state !== GameState.Setup)
      throw new Error("Game not in setup state");
    this._state = GameState.InGame;
    performEvent(
      {
        type: "event:game.start",
        data: {},
      },
      this
    );
    let previous: Player | null = null;
    while (true) {
      const current = this._players.at(this._turnPlayerIndex);
      if (!current)
        throw new Error(`Player not found at index ${this._turnPlayerIndex}`);
      performEvent(
        {
          type: "event:game.new_turn",
          data: {
            previous,
            current,
          },
        },
        this
      );
      this._turn += 1;
      if (this._turnDirection === "normal") {
        this._turnPlayerIndex = Math.abs(
          (this._players.length + this._turnPlayerIndex + 1) %
            this._players.length
        );
      } else if (this._turnDirection === "reversed") {
        this._turnPlayerIndex = Math.abs(
          (this._players.length + this._turnPlayerIndex - 1) %
            this._players.length
        );
      }
      previous = current;
    }
  }
  makeGameObject() {
    const gameObject = _.cloneDeep(this.gameObject);
    gameObject.players = this._players.map((p) => p.makeGameObject());
    return gameObject;
  }
}

function bindDefaults(channel: Channel): Promise<void> {
  return new Promise((resolve, reject) => {
    channel
      .bind("pusher:subscription_succeeded", () => {
        console.log("[GAME/init_host]", "Subscription succeeded");
        resolve();
      })
      .bind("pusher:subscription_error", (error: any) => {
        console.log("[GAME/init_host]", "Subscription error", error);
        reject(error);
      })
      .bind("pusher:member_added", (member: any) => {
        console.log("[GAME/init_host]", "Member added", member);
      })
      .bind("pusher:member_removed", (member: any) => {
        console.log("[GAME/init_host]", "Member removed", member);
      })
      .bind("pusher:member_updated", (member: any) => {
        console.log("[GAME/init_host]", "Member updated", member);
      });
  });
}
