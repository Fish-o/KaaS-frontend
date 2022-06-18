import { Game } from "./Game";
import { Card } from "./gameObjects/Card";
import { Deck } from "./gameObjects/Deck";
import { Hand, Player } from "./gameObjects/Player";

interface FilterObject {
  type: `filter:${string}`;
  maxAmount: number;
  minAmount: number;
  filter: { [key: string]: any };
}

export interface DeckFilterObject extends FilterObject {
  type: "filter:deck";
  filter: Partial<{
    has_tag: string;
    has_one_of_tags: string[];
    has_all_of_tags: string[];

    has_card: CardFilterObject;
    has_x_of_cards: {
      amount: number;
      cards: CardFilterObject;
    };

    $not: DeckFilterObject;
    $and: DeckFilterObject[];
    $or: DeckFilterObject[];
  }>;
}

export interface PlayerFilterObject extends FilterObject {
  type: "filter:player";
  filter: Partial<{
    has_tag: string;
    has_one_of_tags: string[];
    has_all_of_tags: string[];

    has_hand: HandFilterObject;

    $not: PlayerFilterObject;
    $and: PlayerFilterObject[];
    $or: PlayerFilterObject[];
  }>;
}

export interface HandFilterObject extends FilterObject {
  type: "filter:hand";
  filter: Partial<{
    has_tag: string;
    has_one_of_tags: string[];
    has_all_of_tags: string[];

    has_card: CardFilterObject;
    has_x_of_cards: {
      amount: number;
      cards: CardFilterObject;
    };
    from_player: PlayerFilterObject;

    $not: HandFilterObject;
    $and: HandFilterObject[];
    $or: HandFilterObject[];
  }>;
}

export interface CardFilterObject extends FilterObject {
  type: "filter:card";
  filter: Partial<{
    has_tag: string;
    has_one_of_tags: string[];
    has_all_of_tags: string[];

    inside: CardHolderFilterObject;

    $not: CardFilterObject;
    $and: CardFilterObject[];
    $or: CardFilterObject[];
  }>;
}
export type CardHolderFilterObject = HandFilterObject | DeckFilterObject;
export type Filter =
  | DeckFilterObject
  | PlayerFilterObject
  | HandFilterObject
  | CardFilterObject;

export function filter(filter: DeckFilterObject, game: Game): Deck[];
export function filter(filter: PlayerFilterObject, game: Game): Player[];
export function filter(filter: HandFilterObject, game: Game): Hand[];
export function filter(filter: CardFilterObject, game: Game): Card[];

export function filter(filter: Filter, game: Game): any {
  switch (filter.type) {
    case "filter:deck":
      return filterDecks(filter, game);
    case "filter:player":
      return filterPlayers(filter, game);
    case "filter:hand":
      return filterHands(filter, game);
    case "filter:card":
      return filterCards(filter, game);
  }
}

function filterPlayers(
  {
    minAmount,
    maxAmount,
    filter: {
      $and,
      $not,
      $or,
      has_hand,
      has_all_of_tags,
      has_one_of_tags,
      has_tag,
    },
  }: PlayerFilterObject,
  game: Game
) {
  const players = game.getAllPlayers();
  const ands: Player[][] = [];
  const not: Player[] = [];

  // Filters
  if (has_all_of_tags)
    ands.push(players.filter((p) => p.hasAllTags(has_all_of_tags)));

  if (has_one_of_tags)
    ands.push(players.filter((p) => p.hasAnyTag(has_one_of_tags)));

  if (has_tag) ands.push(players.filter((p) => p.hasTag(has_tag)));

  if (has_hand) {
    if (has_hand.minAmount !== 1 || has_hand.maxAmount !== 1)
      throw new Error("has_hand can only have minAmount and maxAmount of 1");
    const hand = filterHands(has_hand, game).shift()!;
    ands.push(players.filter((p) => p.hasHand(hand)));
  }

  if ($and) ands.push(...$and.map((f) => filterPlayers(f, game)));

  if ($or)
    ands.push(
      $or
        .map((f) => filterPlayers(f, game))
        .reduce((acc, curr) => {
          return acc.concat(curr);
        }, [])
        .filter((p) => p !== undefined)
        .filter((p, i, a) => a.indexOf(p) === i)
    );

  if ($not) not.push(...filterPlayers($not, game));

  // Combine the ands and remove the nots
  let filteredPlayers = [...players];
  ands.forEach((and) => {
    filteredPlayers = filteredPlayers.filter((p) => and.includes(p));
  });
  filteredPlayers = filteredPlayers.filter((p) => !not.includes(p));

  // Min and max amount
  if (filterPlayers.length > maxAmount)
    filteredPlayers = filteredPlayers.slice(0, maxAmount);
  if (filterPlayers.length < minAmount)
    throw new Error(
      `Not enough players found. minAmount: ${minAmount}, found: ${filterPlayers.length}`
    );

  // Done!
  return filteredPlayers;
}

function filterHands(
  {
    minAmount,
    maxAmount,
    filter: {
      $and,
      $not,
      $or,
      from_player,
      has_all_of_tags,
      has_one_of_tags,
      has_tag,
      has_card,
      has_x_of_cards,
    },
  }: HandFilterObject,
  game: Game
): Hand[] {
  const hands = game.getAllHands();
  const ands: Hand[][] = [];
  const not: Hand[] = [];

  // Filters
  if ($and) ands.push(...$and.map((f) => filterHands(f, game)));
  if ($or)
    ands.push(
      $or
        .map((f) => filterHands(f, game))
        .reduce((acc, curr) => {
          return acc.concat(curr);
        }, [])
        .filter((h) => h !== undefined)
        .filter((h, i, a) => a.indexOf(h) === i)
    );
  if ($not) not.push(...filterHands($not, game));

  if (from_player) {
    if (from_player.minAmount !== 1 || from_player.maxAmount !== 1)
      throw new Error("from_player can only have minAmount and maxAmount of 1");
    const player = filterPlayers(from_player, game).shift()!;
    ands.push([player.hand]);
  }

  if (has_all_of_tags)
    ands.push(hands.filter((h) => h.hasAllTags(has_all_of_tags)));

  if (has_one_of_tags)
    ands.push(hands.filter((h) => h.hasAnyTag(has_one_of_tags)));

  if (has_tag) ands.push(hands.filter((h) => h.hasTag(has_tag)));

  if (has_card) {
    if (has_card.minAmount !== 1 || has_card.maxAmount !== 1)
      throw new Error("has_card can only have minAmount and maxAmount of 1");
    const card = filterCards(has_card, game).shift()!;
    ands.push(hands.filter((h) => h.hasCard(card)));
  }

  if (has_x_of_cards) {
    const amount = has_x_of_cards.amount;
    const cards = filterCards(has_x_of_cards.cards, game);
    ands.push(hands.filter((h) => h.hasXOfCards(amount, cards)));
  }

  // Combine the ands and remove the nots
  let filteredHands = [...hands];
  ands.forEach((and) => {
    filteredHands = filteredHands.filter((h) => and.includes(h));
  });
  filteredHands = filteredHands.filter((h) => !not.includes(h));

  // Min and max amount
  if (filteredHands.length > maxAmount)
    filteredHands = filteredHands.slice(0, maxAmount);
  if (filteredHands.length < minAmount)
    throw new Error(
      `Not enough hands found. minAmount: ${minAmount}, found: ${filteredHands.length}`
    );

  // Done!
  return filteredHands;
}

function filterCards(
  {
    maxAmount,
    minAmount,
    filter: {
      $and,
      $not,
      $or,
      has_all_of_tags,
      has_one_of_tags,
      has_tag,
      inside,
    },
  }: CardFilterObject,
  game: Game
): Card[] {
  const cards = game.getAllCards();
  const ands: Card[][] = [];
  const not: Card[] = [];

  // Filters
  if ($and) ands.push(...$and.map((f) => filterCards(f, game)));
  if ($or)
    ands.push(
      $or
        .map((f) => filterCards(f, game))
        .reduce((acc, curr) => {
          return acc.concat(curr);
        }, [])
        .filter((c, i, a) => a.indexOf(c) === i)
    );
  if ($not) not.push(...filterCards($not, game));

  if (has_all_of_tags)
    ands.push(cards.filter((c) => c.hasAllTags(has_all_of_tags)));

  if (has_one_of_tags)
    ands.push(cards.filter((c) => c.hasAnyTag(has_one_of_tags)));

  if (has_tag) ands.push(cards.filter((c) => c.hasTag(has_tag)));

  if (inside) {
    if (inside.minAmount !== 1 || inside.maxAmount !== 1)
      throw new Error("inside can only have minAmount and maxAmount of 1");
    const container = filterCardHolders(inside, game).shift()!;
    ands.push(cards.filter((card) => container.hasCard(card)));
  }

  // Combine the ands and remove the nots
  let filteredCards = [...cards];
  ands.forEach((and) => {
    filteredCards = filteredCards.filter((c) => and.includes(c));
  });
  filteredCards = filteredCards.filter((c) => !not.includes(c));

  // Min and max amount
  if (filteredCards.length > maxAmount)
    filteredCards = filteredCards.slice(0, maxAmount);
  if (filteredCards.length < minAmount)
    throw new Error(
      `Not enough cards found. minAmount: ${minAmount}, found: ${filteredCards.length}`
    );

  // Done!
  return filteredCards;
}

function filterDecks(
  {
    minAmount,
    maxAmount,
    filter: {
      $and,
      $not,
      $or,
      has_all_of_tags,
      has_one_of_tags,
      has_tag,
      has_x_of_cards,
      has_card,
    },
  }: DeckFilterObject,
  game: Game
): Deck[] {
  const decks = game.getAllDecks();
  const ands: Deck[][] = [];
  const not: Deck[] = [];

  // Filters
  if ($and) ands.push(...$and.map((f) => filterDecks(f, game)));
  if ($or)
    ands.push(
      $or
        .map((f) => filterDecks(f, game))
        .reduce((acc, curr) => {
          return acc.concat(curr);
        }, [])
        .filter((d, i, a) => a.indexOf(d) === i)
    );
  if ($not) not.push(...filterDecks($not, game));

  if (has_all_of_tags)
    ands.push(decks.filter((d) => d.hasAllTags(has_all_of_tags)));

  if (has_one_of_tags)
    ands.push(decks.filter((d) => d.hasAnyTag(has_one_of_tags)));

  if (has_tag) ands.push(decks.filter((d) => d.hasTag(has_tag)));

  if (has_card) {
    if (has_card.minAmount !== 1 || has_card.maxAmount !== 1)
      throw new Error("has_card can only have minAmount and maxAmount of 1");
    const card = filterCards(has_card, game).shift()!;
    ands.push(decks.filter((d) => d.hasCard(card)));
  }

  if (has_x_of_cards) {
    const amount = has_x_of_cards.amount;
    const cards = filterCards(has_x_of_cards.cards, game);
    ands.push(decks.filter((d) => d.hasXOfCards(amount, cards)));
  }

  // Combine the ands and remove the nots
  let filteredDecks = [...decks];
  ands.forEach((and) => {
    filteredDecks = filteredDecks.filter((d) => and.includes(d));
  });
  filteredDecks = filteredDecks.filter((d) => !not.includes(d));

  // Min and max amount
  if (filteredDecks.length > maxAmount)
    filteredDecks = filteredDecks.slice(0, maxAmount);
  if (filteredDecks.length < minAmount)
    throw new Error(
      `Not enough decks found. minAmount: ${minAmount}, found: ${filteredDecks.length}`
    );

  return filteredDecks;
}

function filterCardHolders(
  cardHolder: CardHolderFilterObject,
  game: Game
): Deck[] | Hand[] {
  switch (cardHolder.type) {
    case "filter:deck":
      return filterDecks(cardHolder, game);
    case "filter:hand":
      return filterHands(cardHolder, game);
  }
}
