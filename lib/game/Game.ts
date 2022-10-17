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
import { log, UI } from "../graphics/ui";
import exampleGame from "../games/example";
import { MethodObject } from "./Method";
import { makeRandomString, randomStringGenerator } from "../random";
import { leave_lobby } from "../networking/client/disconnect";

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
export async function init_game(): Promise<Game> {
  let queryParams = new URLSearchParams(window.location.search);
  const lobby = queryParams.get("lobby");
  const password = queryParams.get("password");
  const playerName = queryParams.get("name");
  if (!lobby || !password || !playerName) {
    console.error("Missing parameters");
    throw new Error("Missing parameters");
  }
  let game: Game;
  log("game", "init");

  if (!queryParams.get("host")) {
    log("game", "initClient");
    game = await Game.init_client(lobby, password, playerName);
    return game;
  }

  log("game", " Generating hostKeys");
  const hostKeys = await generateKeyPair();
  //Get the game from localStorage
  let gameData;
  let gameDataString = localStorage.getItem("gameSettings");
  if (gameDataString) {
    gameData = JSON.parse(gameDataString) as GameObject;
  }
  if (!gameData) {
    gameData = exampleGame;
  }
  game = new Game(gameData, hostKeys);
  log("game", "initHost");
  await game.init_host(lobby, password, playerName);
  return game;
}

export class GameManager {
  public _id = nanoid(3);

  public game!: Game;
  private abort = false;
  private _lastTime: number = Date.now();
  private _initializing: boolean = false;

  constructor() {}
  public async init() {
    if (this._initializing) throw new Error("Already initializing");
    else if (this.game) throw new Error("Already initialized");
    this._initializing = true;
    try {
      const game = await init_game();
      this.game = game;
      if (this.abort) {
        log(this._id + " gameManager", " <init> Stopped, cleaning up");
        return this.cleanup();
      }
      this._initializing = false;
      log(this._id + " gameManager", " <init>", "Init'd");
    } catch (e) {
      log(this._id + " gameManager", " <init>", "ERROR", e);
      console.error(e);
      this._initializing = false;
      this.abort = true;
    }
  }
  private cleanup() {
    this.game.abort();
  }
  public stop() {
    if (this.abort)
      return log(this._id + " graphics", " <stop> Redundant stop call");
    this.abort = true;
    if (this._initializing)
      return log(
        this._id + " graphics",
        " <stop> Initializing, it can handle it"
      );
    else if (!this.game)
      return log(
        this._id + " graphics",
        " <stop> Not initialized, nothing to do"
      );
    log(this._id + " graphics", " <stop> Cleaned up!");
  }
}

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

  public ui: UI;
  private _methods: Map<`method:${string}`, MethodObject>;
  public seed: string;

  // public randomNum: () => number;
  public makeID: () => string;
  constructor(
    private gameObject: GameObject,
    auth: { privateKey: CryptoKey; publicKey: CryptoKey },
    lobbyInfo?: LobbyInfo,
    seed?: string
  ) {
    this._user_id = lobbyInfo?.user_id || nanoid();

    if (seed) this.seed = seed;
    else this.seed = makeRandomString(16);

    this.makeID = randomStringGenerator(10, this.seed);

    const { privateKey, publicKey } = auth;

    this._private_key = privateKey;
    this._public_key = publicKey;
    this._turn = 1;
    this._turnPlayerIndex = 0;

    this._turnDirection = gameObject.settings.turnDirection;
    this._maxPlayerCount = gameObject.settings.maxPlayerCount;
    this._minPlayerCount = gameObject.settings.minPlayerCount;
    this._players = gameObject.players.map((p) => resolvePlayer(p));

    this._decks = resolveDecks(gameObject.decks, this.makeID);
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

    this.storeMethods(gameObject.methods);
    this.ui = new UI(this);
  }
  async abort(): Promise<void> {
    await this.disconnect();
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
    this.issueUpdate(this);
    return player;
  }
  removePlayer(player: Player): void {
    if (this._state !== GameState.Setup)
      throw new Error(
        "Cannot remove player from game that is not in setup state"
      );
    this._players = this._players.filter((p) => p !== player);
    this.issueUpdate(this);
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
  private storeMethods(methods: MethodObject[]): void {
    if (!methods) {
      this._methods = new Map();
      return;
    }

    const methodsMap: Map<MethodObject["type"], MethodObject> = new Map();
    for (let method of methods) methodsMap.set(method.type, method);
    this._methods = methodsMap;
  }

  getEventsFromType<T extends EventObject>(
    type: EventObject["type"]
  ): T[] | undefined {
    return this._events.get(type) as T[];
  }

  getMethodFromName(name: MethodObject["type"]): MethodObject | undefined {
    return this._methods.get(name);
  }

  // Game lifecycle

  static async init_client(
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
    const lobby = pusher.subscribe(`private-lobby-${lobbyName}`);
    await bindDefaults(lobby);
    const gameState = await checkAlive(user_id, lobby);
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

    const { lobby_key, gameObj, seed } = await join_lobby(
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
      },
      seed
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
    log("[GAME/init_host]", "Initializing game");
    if (this._state !== GameState.Setup || this._pusher)
      throw new Error("Game already initialized");
    console.log(process.env);
    console.log("Pusher");
    const pusher = new Pusher("9b15d4512b24e69e67f5", {
      cluster: "us2",
      authEndpoint: "/api/pusher/auth",
      forceTLS: false,
    });
    this._pusher = pusher;
    log("GAME/init_host", "Creating lobby");
    const lobby = pusher.subscribe(`private-lobby-${lobbyName}`);
    log("GAME/init_host", "Created lobby", lobby.name);
    await bindDefaults(lobby);

    const gameState = await checkAlive(this.user_id, lobby);

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
            cards: [],
            tags: [],
            visible: false,
            selfVisible: true,
          },
        },
      },
    });

    bindEvents(this, lobby);
    log("GAME/init_host", "Created lobby", lobby.name, ", binding host events");
    bindHostEvents(this, lobby);
  }

  private async disconnect() {
    if (this._lobbyChannel && this._lobbyPassword)
      await leave_lobby(this.user_id, this._lobbyChannel, this._lobbyPassword);
    log("GAME/pusher", "Disconnecting from Pusher...");
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
      this.ui?.game_tick();
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

  async end(winner: Player, losers: Player[]) {
    this.ui.gameWin(winner);

    this._state = GameState.End;
    await performEvent(
      {
        type: "event:game.end",
        data: {},
      },
      this
    );
    // wait for 5 seconds before disconnecting
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await this.disconnect();
    // Redirect to join page
    window.location.href = "/";
  }

  private _onUpdate: ((object: Game) => void)[] = [];
  subscribeUpdate(callback: (object: Game) => void) {
    this._onUpdate.push(callback);
  }
  unSubscribeUpdate(callback: (object: Game) => void) {
    this._onUpdate = this._onUpdate.filter((c) => c !== callback);
  }
  issueUpdate(object: Game) {
    this._onUpdate.forEach((c) => c(object));
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
