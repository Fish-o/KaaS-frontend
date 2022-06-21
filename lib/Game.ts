import { Variable } from "./Actions";
import { EventObject, performEvent } from "./Events";
import { Filter } from "./Filters";
import { Card } from "./Objects/Card";
import { Deck } from "./Objects/Deck";
import { Hand, Player } from "./Objects/Player";
import {
  GameObject,
  PlayerObject,
  resolveDecks,
  resolvePlayer,
} from "./Resolvers";

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

export class Game {
  private _state?: GameState;
  private _player: Player[];
  private _decks: Deck[];
  private _turn: number;
  private _turnPlayerIndex: number;
  private _turnDirection: "normal" | "reversed";
  private _events: Map<EventObject["type"], EventObject> = new Map();

  constructor(gameObject: GameObject) {
    this._player = [];
    this._decks = [];
    this._turn = 1;
    this._turnPlayerIndex = 0;
    this._turnDirection = gameObject.settings.turnDirection;
    this._decks = resolveDecks(gameObject.decks);
    this.storeEvents(gameObject.events);

    this.init();
  }
  // Manage Players
  addPlayer(playerObject: PlayerObject): Player {
    if (this._state !== GameState.Setup)
      throw new Error("Cannot add player to game that is not in setup state");
    const player = resolvePlayer(playerObject);
    this._player.push(player);
    return player;
  }
  removePlayer(player: Player): void {
    if (this._state !== GameState.Setup)
      throw new Error(
        "Cannot remove player from game that is not in setup state"
      );
    this._player = this._player.filter((p) => p !== player);
  }

  getAllCards(): Card[] {
    const deck_cards = this._decks.reduce((acc, deck) => {
      return acc.concat(deck.cards);
    }, [] as Card[]);
    const player_cards = this._player.reduce((acc, player) => {
      return acc.concat(player.hand.cards);
    }, [] as Card[]);
    return deck_cards.concat(player_cards);
  }
  getAllPlayers(): readonly Player[] {
    return this._player;
  }
  getAllDecks(): readonly Deck[] {
    return this._decks;
  }
  getAllHands(): Hand[] {
    return this._player.map((p) => p.hand);
  }

  // Events
  private storeEvents(events: EventObject[]) {
    const eventsMaps: Map<EventObject["type"], EventObject> = new Map();
    for (let event of events) eventsMaps.set(event.type, event);
    this._events = eventsMaps;
  }
  getEventFromType<T extends EventObject>(
    type: EventObject["type"]
  ): T | undefined {
    return this._events.get(type) as T;
  }

  // Game lifecycle
  private init() {
    if (typeof this._state !== "undefined")
      throw new Error("Setup has to be the first state");
    this._state = GameState.Setup;
    performEvent(
      {
        type: "event:game.init",
        data: {},
      },
      this
    );
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
      const current = this._player.at(this._turnPlayerIndex);
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
          (this._player.length + this._turnPlayerIndex + 1) %
            this._player.length
        );
      } else if (this._turnDirection === "reversed") {
        this._turnPlayerIndex = Math.abs(
          (this._player.length + this._turnPlayerIndex - 1) %
            this._player.length
        );
      }
      previous = current;
    }
  }
}
