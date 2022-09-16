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
import { Graphics, log } from "../graphics";

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
  private _turnDirection: "clockwise" | "anti-clockwise";
  private _events: Map<EventObject["type"], EventObject[]> = new Map();
  private _pusher: Pusher | undefined;

  private _lobbyHost: boolean = false;

  private _lobbyKey: CryptoKey | undefined;
  private _lobbyName: string | undefined;
  private _lobbyPassword: string | undefined;
  private _lobbyChannel: Channel | undefined;

  private _maxPlayerCount: number;
  private _minPlayerCount: number;

  public currentPlayer: Player | undefined;
  public nextPlayer: Player | undefined;

  constructor(
    public graphics: Graphics,
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
  abort(): void {
    this._pusher?.disconnect();
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

  // getVariable(identifier: GameIdentifier) {
  //   const [type, id] = identifier.split(":");
  //   if (type === "deck") {
  //     const deck = this._decks.find((d) => d.id === id);
  //     return deck ?? null;
  //   } else if (type === "player") {
  //     const player = this._players.find((p) => p.id === id);
  //     return player ?? null;
  //   } else if (type === "hand") {
  //     const hand = this._players.find((p) => p.id === id);
  //     return hand ?? null;
  //   } else if (type === "card") {
  //     const card = this.getAllCards().find((c) => c.id === id);
  //     return card ?? null;
  //   } else {
  //     throw new Error(`Unknown identifier type: ${identifier}`);
  //   }
  // }
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

  static async init_client(
    g: Graphics,
    lobbyName: string,
    lobbyPassword: string,
    playerName: string
  ) {
    const user_id = nanoid();
    const pusher = new Pusher("9b15d4512b24e69e67f5", {
      cluster: "us2",
      authEndpoint: "/api/pusher/auth",
      forceTLS: false,
    });
    const p = pusher;
    assure(p, g);
    const lobby = pusher.subscribe(`private-lobby-${lobbyName}`);
    assure(p, g);
    await bindDefaults(lobby);
    assure(p, g);
    const gameState = await checkAlive(user_id, lobby);
    assure(p, g);
    if (gameState === GameState.InGame || gameState === GameState.End) {
      log("[GAME/init_client]", "Lobby is alive, and has already started!!!!");
      throw new Error("Lobby has already started");
    } else if (gameState !== GameState.Setup) {
      log("[GAME/init_client]", "Lobby dead, cant join");
      throw new Error("Lobby with that name does not exists");
    }

    // this._lobbyName = lobbyName;
    // this._lobbyPassword = lobbyPassword;
    // this._lobbyHost = false;
    const { privateKey, publicKey } = await generateKeyPair();
    assure(p, g);

    const { lobby_key, gameObj } = await join_lobby(
      user_id,
      publicKey,
      privateKey,
      lobby,
      lobbyPassword,
      playerName
    );
    assure(p, g);

    const game = new Game(
      g,
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
    assure(p, g);
    pusher.unbind();
    pusher.unbind_all();
    assure(p, g);
    return game;
  }
  assure() {
    if (this.graphics.abort) {
      this.disconnect();
      throw new Error("Graphics aborted");
    }
  }
  async init_host(
    lobbyName: string,
    lobbyPassword: string,
    playerName: string
  ) {
    log("[GAME/init_host]", "Initializing game");
    if (this._state !== GameState.Setup || this._pusher)
      throw new Error("Game already initialized");
    const pusher = new Pusher("9b15d4512b24e69e67f5", {
      cluster: "us2",
      authEndpoint: "/api/pusher/auth",
      forceTLS: false,
    });
    this._pusher = pusher;
    this.assure();
    log(this.graphics._id + " GAME/init_host", "Creating lobby");
    const lobby = pusher.subscribe(`private-lobby-${lobbyName}`);
    log(this.graphics._id + " GAME/init_host", "Created lobby", lobby.name);
    await bindDefaults(lobby);
    this.assure();

    const gameState = await checkAlive(this.user_id, lobby);
    this.assure();

    if (gameState === GameState.InGame || gameState === GameState.End) {
      log("GAME/init_host", "Lobby is alive, and has already started!!!!");
      throw new Error("Lobby with that name already exists");
    } else if (gameState === GameState.Setup) {
      log("GAME/init_host", "Lobby already alive, could join it");
      throw new Error("Lobby with that name already exists");
    }
    log("GAME/init_host", "Lobby dead! Creating lobby as host");

    this._pusher = pusher;
    this._lobbyChannel = lobby;
    this._lobbyChannel = lobby;
    this._lobbyHost = true;
    this._lobbyKey = await generateSymmetricKey();
    this.assure();
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
                  name: playerName,
                  description: "a",
                  tags: [],
                  data: {},
                },
              },
            ],
            tags: [],
          },
        },
      },
    });

    bindEvents(this, lobby);
    log("GAME/init_host", "Created lobby", lobby.name, ", binding host events");
    bindHostEvents(this, lobby);
    this.assure();
  }

  private disconnect() {
    log(this.graphics._id + " GAME/pusher", "Disconnecting from Pusher...");
    if (this._pusher) this._pusher.disconnect();
  }

  start() {
    if (this._state !== GameState.Setup)
      throw new Error("Game not in setup state");
    this._state = GameState.InGame;
    log("GAME/start", "Starting game: firing init event");
    performEvent(
      {
        type: "event:game.init",
        data: {},
      },
      this
    );
    log("GAME/start", "Starting game: firing start event");
    setTimeout(() => {
      performEvent(
        {
          type: "event:game.start",
          data: {},
        },
        this
      );
      let previous: Player | null = null;
      this.graphics.game_tick();
    }, 500);
  }

  private getNextPlayer(save: boolean): Player {
    let turnPlayerIndex;
    if (this._turnDirection === "clockwise") {
      turnPlayerIndex = Math.abs(
        (this._players.length + this._turnPlayerIndex + 1) %
          this._players.length
      );
    } else if (this._turnDirection === "anti-clockwise") {
      turnPlayerIndex = Math.abs(
        (this._players.length + this._turnPlayerIndex - 1) %
          this._players.length
      );
    } else {
      throw new Error("Invalid turn direction");
    }
    if (save) {
      this._turnPlayerIndex = turnPlayerIndex;
    }
    return this._players[turnPlayerIndex];
  }

  private _previous_player: Player | null = null;
  async tick() {
    const current = this._players.at(this._turnPlayerIndex);
    if (!current)
      throw new Error(`Player not found at index ${this._turnPlayerIndex}`);
    let next = this.getNextPlayer(false);

    this.currentPlayer = current;
    this.nextPlayer = next;
    log("GAME/tick", "Tick", current.name, this._turnPlayerIndex);
    await performEvent(
      {
        type: "event:game.new_turn",
        data: {
          previous: this._previous_player,
          current,
          next,
        },
      },
      this
    );
    this._turn += 1;
    next = this.getNextPlayer(true);
    this._previous_player = current;
    this.currentPlayer = next;
    return {
      next: next,
    };
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
        log("GAME/init_host", "Subscription succeeded");
        resolve();
      })
      .bind("pusher:subscription_error", (error: any) => {
        log("GAME/init_host", "Subscription error", error);
        reject(error);
      })
      .bind("pusher:member_added", (member: any) => {
        log("GAME/init_host", "Member added", member);
      })
      .bind("pusher:member_removed", (member: any) => {
        log("GAME/init_host", "Member removed", member);
      })
      .bind("pusher:member_updated", (member: any) => {
        log("GAME/init_host", "Member updated", member);
      });
  });
}

function assure(p: Pusher, graphics: Graphics) {
  if (graphics.abort) {
    p.disconnect();
    throw new Error("Aborting");
  }
}
