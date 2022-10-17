import { BaseGameObject } from ".";
import { Game } from "../Game";
import { HandObject, PlayerObject } from "../Resolvers";
import { Card } from "./Card";

export class Player extends BaseGameObject {
  private _user_id: string;
  private _name: string;
  private _hands: [Hand];

  constructor(opts: {
    name: string;
    hand: Hand;
    tags: string[];
    data: Record<string, string>;
    user_id: string;
  }) {
    super(opts.tags, opts.data);
    this._user_id = opts.user_id;
    this._name = opts.name;
    this._hands = [opts.hand];
  }
  get name() {
    return this._name;
  }
  set name(newName: string) {
    this._name = newName;
  }
  get hand() {
    return this._hands[0];
  }
  get user_id() {
    return this._user_id;
  }

  hasHand(hand: Hand) {
    return this._hands.indexOf(hand) !== -1;
  }

  contains(hand: Hand) {
    return this._hands.indexOf(hand) !== -1;
  }
  makeGameObject(): PlayerObject {
    return {
      type: "object:player",
      object: {
        tags: [...this.tags],
        name: this.name,
        user_id: this.user_id,
        hand: this.hand.makeGameObject(),
      },
    };
  }

  getIdentifier(): `player:${string}` {
    return `player:${this.id}`;
  }

  isCurrentPlayer(game: Game) {
    return this.id === game.currentPlayer?.id;
  }

  isClientPlayer(game: Game) {
    return this.user_id === game.user_id;
  }

  isNextPlayer(game: Game) {
    return this.id === game.nextPlayer?.id;
  }
}

export class Hand extends BaseGameObject {
  private _cards: Card[];

  private _visible: boolean = false;
  private _selfVisible: boolean = false;

  constructor(
    private opts: {
      name: string;
      tags: string[];
      data: Record<string, string>;
      cards: Card[];
      visible: boolean;
      selfVisible: boolean;
    }
  ) {
    super(opts.tags, opts.data);
    this._cards = opts.cards;
    this._visible = opts.visible;
    this._selfVisible = opts.selfVisible;
  }
  get cards() {
    return this._cards as readonly Card[];
  }
  visibleTo(game: Game, player: Player) {
    // return true;
    if (this._visible) {
      return true;
    }
    if (player.isClientPlayer(game)) {
      return this._selfVisible;
    }
    return false;
  }

  hasCard(card: Card) {
    return this._cards.indexOf(card) !== -1;
  }

  hasOneOfCards(cards: Card[]) {
    return cards.some((c) => this.hasCard(c));
  }

  hasAllCards(cards: Card[]) {
    return cards.every((c) => this.hasCard(c));
  }

  hasXOfCards(x: number, cards: Card[]) {
    return this._cards.filter((c) => cards.indexOf(c) !== -1).length >= x;
  }

  contains(card: Card) {
    return this._cards.indexOf(card) !== -1;
  }

  // Actions
  addCard(card: Card, to: "top" | "bottom" | "random" = "top"): void {
    console.log("Adding card to hand", card);
    if (to === "top") this._cards.unshift(card);
    else if (to === "bottom") this._cards.push(card);
    else if (to === "random")
      this._cards.splice(
        Math.floor(Math.random() * this._cards.length),
        0,
        card
      );
    this.issueUpdate(this);
  }
  removeCard(card: Card) {
    this._cards = this._cards.filter((c) => c !== card);
    this.issueUpdate(this);
  }

  setVisibility(visible: boolean) {
    this._visible = visible;
    this.issueUpdate(this);
  }

  setSelfVisibility(selfVisible: boolean) {
    this._selfVisible = selfVisible;
    this.issueUpdate(this);
  }

  makeGameObject(): HandObject {
    return {
      type: "object:hand",
      object: {
        tags: [...this.tags],
        name: this.opts.name,
        cards: this.cards.map((c) => c.makeGameObject()),
        visible: this._visible,
        selfVisible: this._selfVisible,
      },
    };
  }

  getIdentifier(): `hand:${string}` {
    return `hand:${this.id}`;
  }
}
