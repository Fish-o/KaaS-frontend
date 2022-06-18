import { BaseGameObject } from ".";
import { Card } from "./Card";

export class Player extends BaseGameObject {
  private _name: string;
  private _hands: [Hand];

  constructor(opts: { name: string; hand: Hand; tags: string[] }) {
    super(opts.tags);
    this._name = opts.name;
    this._hands = [opts.hand];
  }
  get name() {
    return this._name;
  }
  get hand() {
    return this._hands[0];
  }

  hasHand(hand: Hand) {
    return this._hands.indexOf(hand) !== -1;
  }
}

export class Hand extends BaseGameObject {
  private _cards: Card[];
  constructor(opts: { name: string; tags: string[]; cards: Card[] }) {
    super(opts.tags);
    this._cards = opts.cards;
  }
  get cards() {
    return this._cards as readonly Card[];
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

  // Actions
  addCard(card: Card): void {
    this._cards.push(card);
  }
  removeCard(card: Card) {
    this._cards = this._cards.filter((c) => c !== card);
  }
}
