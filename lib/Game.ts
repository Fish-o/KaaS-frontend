import { Variable } from "./Actions";
import { EventObject, performEvent } from "./Events";
import { Filter } from "./Filters";
import { Card } from "./Objects/Card";
import { Deck, DeckType } from "./Objects/Deck";
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
  private _events: Map<EventObject["type"], EventObject[]> = new Map();

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

const game = new Game({
  type: "game",
  name: "test",
  description: "Eyo",
  decks: [
    {
      type: "object:deck",
      object: {
        cards: [
          {
            type: "object:card",
            object: {
              name: "Test 1.1",
              description: null,
              tags: ["card", "test1"],
            },
          },
          {
            type: "object:card",
            object: {
              name: "Test 1.2",
              description: null,
              tags: ["card", "test1"],
            },
          },
          {
            type: "object:card",
            object: {
              name: "Test 2",
              description: null,
              tags: ["card", "test2"],
            },
          },
        ],
        type: DeckType.finite,
        cardsOpen: false,
        tags: ["deck1"],
        hidden: false,
        overflow: null,
      },
    },
    {
      type: "object:deck",
      object: {
        cards: [],
        type: DeckType.finite,
        cardsOpen: false,
        tags: ["deck2"],
        hidden: false,
        overflow: null,
      },
    },
  ],
  settings: {
    minPlayerCount: 1,
    maxPlayerCount: 1,
    turnDirection: "normal",
  },

  events: [
    {
      type: "event:game.init",
      actions: [
        {
          type: "action:find.decks",
          args: {
            filter: {
              type: "filter:deck",
              maxAmount: 1,
              minAmount: 1,
              filter: {
                has_tag: "deck1",
              },
            },
          },
          returns: {
            found_one: "$deck1",
          },
        },
        {
          type: "action:find.decks",
          args: {
            filter: {
              type: "filter:deck",
              maxAmount: 1,
              minAmount: 1,
              filter: {
                has_tag: "deck2",
              },
            },
          },
          returns: {
            found_one: "$deck2",
          },
        },
        {
          type: "action:find.cards",
          args: {
            filter: {
              type: "filter:card",
              maxAmount: 10,
              minAmount: 3,
              filter: {
                inside: "$deck1",
              },
            },
          },
          returns: {
            found_many: "$cards_to_move",
          },
        },
        {
          type: "action:debug",
          args: {
            find: "$deck2",
          },
        },
        {
          type: "action:cards.move",
          args: { cards: "$cards_to_move", to: "$deck2" },
          returns: {},
        },
        {
          type: "action:debug",
          args: {
            find: "$deck2",
          },
        },
      ],
      returns: {},
    },
  ],
});
