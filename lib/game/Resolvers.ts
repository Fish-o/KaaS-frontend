import { EventObject } from "./Events";
import { Card } from "./Objects/Card";
import { Deck, DeckType } from "./Objects/Deck";
import { Hand, Player } from "./Objects/Player";

export interface CardObject {
  type: "object:card";
  object: {
    tags: string[];
    name: string;
    description: string | null;
  };
}

export interface DeckObject {
  type: "object:deck";
  object: {
    tags: string[];
    cardsOpen: boolean;
    hidden: boolean;
    type: DeckType;
    overflow: number | null;
    cards: CardObject[];
  };
}

export interface GameObject {
  type: "game";
  name: string;
  description: string;
  decks: DeckObject[];
  events: EventObject[];
  players: PlayerObject[];
  settings: {
    maxPlayerCount: number;
    minPlayerCount: number;
    turnDirection: "normal" | "reversed";
  };
}

export interface HandObject {
  type: "object:hand";
  object: {
    tags: string[];
    name: string;
    cards: CardObject[];
  };
}
export interface PlayerObject {
  type: "object:player";
  object: {
    tags: string[];
    name: string;
    user_id: string;
    hand: HandObject;
  };
}

export function resolvePlayer(playerObject: PlayerObject): Player {
  return new Player({
    user_id: playerObject.object.user_id,
    name: playerObject.object.name,
    hand: resolveHand(playerObject.object.hand),
    tags: playerObject.object.tags,
  });
}
export function resolveHand(handObject: HandObject): Hand {
  return new Hand({
    name: handObject.object.name,
    cards: resolveCards(handObject.object.cards),
    tags: handObject.object.tags,
  });
}
export function resolveDecks(decks: DeckObject[]): Deck[] {
  return decks.map((deck) => {
    return new Deck({
      tags: deck.object.tags,
      cards: resolveCards(deck.object.cards),
      cardsOpen: deck.object.cardsOpen,
      hidden: deck.object.hidden,
      type: deck.object.type,
      overflow: deck.object.overflow ?? undefined,
    });
  });
}
export function resolveCards(cards: CardObject[]): Card[] {
  return cards.map((card) => {
    return new Card({
      name: card.object.name,
      description: card.object.description ?? undefined,
      tags: card.object.tags,
    });
  });
}
