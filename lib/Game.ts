import { filter, Filter } from "./Filters";
import { Card } from "./gameObjects/Card";
import { Deck, DeckType } from "./gameObjects/Deck";
import { Hand, Player } from "./gameObjects/Player";
import {
  GameObject,
  PlayerObject,
  resolveDecks,
  resolvePlayer,
} from "./resolvers";

export enum GameState {
  Setup = "setup",
  InGame = "in-game",
  End = "end",
}
export class Game {
  private _state: GameState;
  private _player: Player[];
  private _decks: Deck[];
  private _turn: number;
  private _turnDirection: "normal" | "reversed";

  constructor(gameObject: GameObject) {
    this._state = GameState.Setup;
    this._player = [];
    this._decks = [];
    this._turn = 0;
    this._turnDirection = gameObject.settings.turnDirection;
    this._decks = resolveDecks(gameObject.decks);
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

  // Resolvers
}
