import _ from "lodash";
import { BaseGameObject } from ".";
import { DeckObject } from "../Resolvers";
import { Card } from "./Card";

export enum DeckType {
  finite = "finite",
  infinite = "infinite",
  repeating = "repeating",
}
export class Deck extends BaseGameObject {
  private _cards: Card[];
  private _originalCards: Card[];
  // Settings
  private _cardsOpen: boolean;
  private _hidden: boolean;
  private _type: DeckType;
  private _overflow: number | undefined;

  constructor(opts: {
    cards: Card[];
    tags: string[];
    cardsOpen: boolean;
    hidden: boolean;
    type: DeckType;
    overflow?: number;
  }) {
    super(opts.tags);
    this._cards = opts.cards;
    this._originalCards = opts.cards;

    this._cardsOpen = opts.cardsOpen;
    this._hidden = opts.hidden;
    this._type = opts.type;
    this._overflow = opts.overflow ?? undefined;
  }

  // Cards
  // Cards are top to bottom
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

  contains(card: Card) {
    return this._cards.indexOf(card) !== -1;
  }

  // Settings
  get hidden() {
    return this._hidden;
  }

  get cardsOpen() {
    return this._cardsOpen;
  }

  get type() {
    return this._type;
  }

  // Actions
  grabCardsFromDeck(amount: number, from: "top" | "bottom" = "top") {
    const grabbedCards: Card[] = [];
    for (let i = 0; i < amount; i++) {
      let card: Card | undefined = undefined;
      switch (this.type) {
        case DeckType.infinite:
          card = _.sample(this.cards);
          break;

        case DeckType.repeating:
          if (this._cards.length === 0) this._cards = [...this._originalCards];
          if (from === "top") card = this._cards.shift();
          else card = this._cards.pop();
          break;

        case DeckType.finite:
          if (from === "top") card = this._cards.shift();
          else card = this._cards.pop();
          break;

        default:
          throw new Error(`Unknown deck DeckType: ${this.type}`);
      }
      if (card) grabbedCards.push(card);
    }
    return grabbedCards;
  }

  addCard(card: Card, to: "top" | "bottom" | "random" = "top") {
    switch (this.type) {
      case DeckType.infinite:
        return;
      case DeckType.repeating:
        if (to === "top") this._cards.unshift(card);
        else if (to === "bottom") this._cards.push(card);
        else if (to === "random")
          this._cards.splice(
            Math.floor(Math.random() * this._cards.length),
            0,
            card
          );
        break;
      case DeckType.finite:
        if (to === "top") this._cards.unshift(card);
        else if (to === "bottom") this._cards.push(card);
        else if (to === "random")
          this._cards.splice(
            Math.floor(Math.random() * this._cards.length),
            0,
            card
          );
        break;
      default:
        throw new Error(`Unknown deck type: ${this.type}`);
    }
    if (
      typeof this._overflow === "number" &&
      this._cards.length > this._overflow
    ) {
      if (to === "bottom") this._cards.shift();
      else this._cards.pop();
    }
  }

  removeCard(card: Card) {
    this._cards = this._cards.filter((c) => c !== card);
  }

  shuffleDeck() {
    this._cards = _.shuffle(this._cards);
  }

  makeGameObject(): DeckObject {
    return {
      type: "object:deck",
      object: {
        cards: this.cards.map((c) => c.makeGameObject()),
        tags: [...this.tags],
        cardsOpen: this.cardsOpen,
        hidden: this.hidden,
        overflow: this._overflow ?? null,
        type: this.type,
      },
    };
  }

  getIdentifier(): `deck:${string}` {
    return `deck:${this.id}`;
  }
}
