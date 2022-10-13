import { EventObject } from "./Events";
import { Card } from "./Objects/Card";
import { ResolveBundles } from "./Objects/CardBundle";
import { Deck, DeckType } from "./Objects/Deck";
import { Hand, Player } from "./Objects/Player";
import { BundleType } from "./Objects/CardBundle";
import { MethodObject } from "./Method";
export interface CardObject {
  type: "object:card";
  object: {
    tags: string[];
    data?: Record<string, string>;
    name: string;
    description: string | null;
  };
}

export interface DeckObject {
  type: "object:deck";
  object: {
    tags: string[];
    data?: Record<string, string>;
    card_bundles?: BundleType[];
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
  methods: MethodObject[];
  players: PlayerObject[];
  settings: {
    maxPlayerCount: number;
    minPlayerCount: number;
    turnDirection: "clockwise" | "anti-clockwise";
  };
}

export interface HandObject {
  type: "object:hand";
  object: {
    tags: string[];
    data?: Record<string, string>;

    name: string;
    cards: CardObject[];

    visible: boolean;
    selfVisible: boolean;
  };
}
export interface PlayerObject {
  type: "object:player";
  object: {
    tags: string[];
    data?: Record<string, string>;

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
    data: playerObject.object.data ?? {},
  });
}
export function resolveHand(handObject: HandObject): Hand {
  return new Hand({
    name: handObject.object.name,
    cards: resolveCards(handObject.object.cards),
    tags: handObject.object.tags,
    data: handObject.object.data ?? {},
    visible: handObject.object.visible,
    selfVisible: handObject.object.selfVisible,
  });
}
export function resolveDecks(
  decks: DeckObject[],
  makeID: () => string
): Deck[] {
  return decks.map((deck) => {
    let cardBundle: Card[] = [];
    if (deck.object.card_bundles) {
      cardBundle = ResolveBundles(deck.object.card_bundles, makeID);
    }
    return new Deck({
      tags: deck.object.tags,
      data: deck.object.data ?? {},
      cards: [...cardBundle, ...resolveCards(deck.object.cards)],
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
      data: card.object.data ?? {},
      description: card.object.description ?? undefined,
      tags: card.object.tags,
    });
  });
}
