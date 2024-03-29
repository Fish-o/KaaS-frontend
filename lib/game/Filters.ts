import { Action, performActions, Variable, VariableMap } from "./Actions";
import { CardHolderResolvable, PlayerResolvable } from "./Actions/resolvables";
import { Game, isValidVariableName } from "./Game";
import { BaseGameObject } from "./Objects";
import { Card } from "./Objects/Card";
import { Deck } from "./Objects/Deck";
import { Hand, Player } from "./Objects/Player";

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

    iterator_parameter: Variable;
    actions: Action[];
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

    iterator_parameter: Variable;
    actions: Action[];
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
    from_player: PlayerResolvable;

    $not: HandFilterObject;
    $and: HandFilterObject[];
    $or: HandFilterObject[];

    iterator_parameter: Variable;
    actions: Action[];
  }>;
}

export interface CardFilterObject extends FilterObject {
  type: "filter:card";
  filter: Partial<{
    has_tag: string;
    has_one_of_tags: string[];
    has_all_of_tags: string[];

    inside: CardHolderResolvable;

    $not: CardFilterObject;
    $and: CardFilterObject[];
    $or: CardFilterObject[];

    iterator_parameter: Variable;
    actions: Action[];
  }>;
}
export type CardHolderFilterObject = HandFilterObject | DeckFilterObject;
export type Filter =
  | DeckFilterObject
  | PlayerFilterObject
  | HandFilterObject
  | CardFilterObject;

export async function performFilter(
  filter: DeckFilterObject,
  variables: VariableMap,
  game: Game
): Promise<Deck[]>;
export async function performFilter(
  filter: PlayerFilterObject,
  variables: VariableMap,
  game: Game
): Promise<Player[]>;
export async function performFilter(
  filter: HandFilterObject,
  variables: VariableMap,
  game: Game
): Promise<Hand[]>;
export async function performFilter(
  filter: CardFilterObject,
  variables: VariableMap,
  game: Game
): Promise<Card[]>;
export async function performFilter(
  filter: Filter,
  variables: VariableMap,
  game: Game
): Promise<BaseGameObject[]>;
export async function performFilter(
  filter: Filter,
  variables: VariableMap,
  game: Game
): Promise<any> {
  switch (filter.type) {
    case "filter:deck":
      return await filterDecks(filter, variables, game);
    case "filter:player":
      return await filterPlayers(filter, variables, game);
    case "filter:hand":
      return await filterHands(filter, variables, game);
    case "filter:card":
      return await filterCards(filter, variables, game);
  }
}

async function filterPlayers(
  {
    minAmount,
    maxAmount,
    filter: {
      actions,
      iterator_parameter,

      $and,
      $not,
      $or,
      has_hand,
      has_all_of_tags,
      has_one_of_tags,
      has_tag,
    },
  }: PlayerFilterObject,
  variables: VariableMap,
  game: Game
): Promise<Player[]> {
  const players = game.getAllPlayers();
  const ands: Player[][] = [];
  const not: Player[] = [];

  // Filters
  if (actions) {
    ands.push(
      players.filter(async (player) => {
        if (iterator_parameter) {
          variables = { ...variables, [iterator_parameter]: player };
          return await performActions(actions, variables, game);
        }
        return false;
      })
    );
  }

  if (has_all_of_tags)
    ands.push(players.filter((p) => p.hasAllTags(has_all_of_tags)));

  if (has_one_of_tags)
    ands.push(players.filter((p) => p.hasAnyTag(has_one_of_tags)));

  if (has_tag) ands.push(players.filter((p) => p.hasTag(has_tag)));

  if (has_hand) {
    if (has_hand.minAmount !== 1 || has_hand.maxAmount !== 1)
      throw new Error("has_hand can only have minAmount and maxAmount of 1");
    const hand = (await filterHands(has_hand, variables, game)).shift()!;
    ands.push(players.filter((p) => p.hasHand(hand)));
  }

  if ($and)
    ands.push(
      ...(await Promise.all($and.map((f) => filterPlayers(f, variables, game))))
    );

  if ($or)
    ands.push(
      (await Promise.all($or.map((f) => filterPlayers(f, variables, game))))
        .reduce((acc, curr) => {
          return acc.concat(curr);
        }, [])
        .filter((p) => p !== undefined)
        .filter((p, i, a) => a.indexOf(p) === i)
    );

  if ($not) not.push(...(await filterPlayers($not, variables, game)));

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
  console.log("filteredPlayers", filteredPlayers);
  console.log({
    actions,
    iterator_parameter,

    $and,
    $not,
    $or,
    has_hand,
    has_all_of_tags,
    has_one_of_tags,
    has_tag,
  });
  // Done!
  return filteredPlayers;
}

async function filterHands(
  {
    minAmount,
    maxAmount,
    filter: {
      actions,
      iterator_parameter,

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
  variables: VariableMap,
  game: Game
): Promise<Hand[]> {
  const hands = game.getAllHands();
  const ands: Hand[][] = [];
  const not: Hand[] = [];

  // Filters
  if (actions) {
    ands.push(
      hands.filter(async (hands) => {
        if (iterator_parameter) {
          variables = { ...variables, [iterator_parameter]: hands };
          return await performActions(actions, variables, game);
        }
        return false;
      })
    );
  }

  if ($and)
    ands.push(
      ...(await Promise.all($and.map((f) => filterHands(f, variables, game))))
    );
  if ($or)
    ands.push(
      (await Promise.all($or.map((f) => filterHands(f, variables, game))))
        .reduce((acc, curr) => {
          return acc.concat(curr);
        }, [])
        .filter((h, i, a) => a.indexOf(h) === i)
    );
  if ($not) not.push(...(await filterHands($not, variables, game)));

  if (from_player && typeof from_player !== "string") {
    if (from_player.minAmount !== 1 || from_player.maxAmount !== 1)
      throw new Error("from_player can only have minAmount and maxAmount of 1");
    const player = (await filterPlayers(from_player, variables, game)).shift()!;
    ands.push([player.hand]);
  } else if (isValidVariableName(from_player)) {
    const player = variables.get(from_player);
    if (Array.isArray(player) && player.length !== 1)
      throw new Error("from_player must have 1 player");
    else if (Array.isArray(player)) {
      let singlePlayer = player.shift()!;
      if (singlePlayer instanceof Player) ands.push([singlePlayer.hand]);
      else throw new Error("from_player must only have players");
    } else if (player instanceof Player) ands.push([player.hand]);
    else throw new Error("from_player must only have a single player");
  }

  if (has_all_of_tags)
    ands.push(hands.filter((h) => h.hasAllTags(has_all_of_tags)));

  if (has_one_of_tags)
    ands.push(hands.filter((h) => h.hasAnyTag(has_one_of_tags)));

  if (has_tag) ands.push(hands.filter((h) => h.hasTag(has_tag)));

  if (has_card) {
    if (has_card.minAmount !== 1 || has_card.maxAmount !== 1)
      throw new Error("has_card can only have minAmount and maxAmount of 1");

    const card = (await filterCards(has_card, variables, game)).shift()!;
    ands.push(hands.filter((h) => h.hasCard(card)));
  }

  if (has_x_of_cards) {
    const amount = has_x_of_cards.amount;
    const cards = await filterCards(has_x_of_cards.cards, variables, game);
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

async function filterCards(
  {
    maxAmount,
    minAmount,
    filter: {
      actions,
      iterator_parameter,
      $and,
      $not,
      $or,
      has_all_of_tags,
      has_one_of_tags,
      has_tag,
      inside,
    },
  }: CardFilterObject,
  variables: VariableMap,
  game: Game
): Promise<Card[]> {
  const cards = game.getAllCards();
  const ands: Card[][] = [];
  const not: Card[] = [];
  console.log("filterCards", {
    maxAmount,
    minAmount,
    filter: {
      actions,
      iterator_parameter,
      $and,
      $not,
      $or,
      has_all_of_tags,
      has_one_of_tags,
      has_tag,
      inside,
    },
  });
  // Filters
  if (actions) {
    ands.push(
      cards.filter(async (cards) => {
        if (iterator_parameter) {
          variables = { ...variables, [iterator_parameter]: cards };
          return await performActions(actions, variables, game);
        }
        return false;
      })
    );
  }

  if ($and)
    ands.push(
      ...(await Promise.all($and.map((f) => filterCards(f, variables, game))))
    );
  if ($or)
    ands.push(
      (await Promise.all($or.map((f) => filterCards(f, variables, game))))
        .reduce((acc, curr) => {
          return acc.concat(curr);
        }, [])
        .filter((c, i, a) => a.indexOf(c) === i)
    );
  if ($not) not.push(...(await filterCards($not, variables, game)));

  if (has_all_of_tags)
    ands.push(cards.filter((c) => c.hasAllTags(has_all_of_tags)));

  if (has_one_of_tags)
    ands.push(cards.filter((c) => c.hasAnyTag(has_one_of_tags)));

  if (has_tag) ands.push(cards.filter((c) => c.hasTag(has_tag)));

  if (inside) {
    if (typeof inside === "string") {
      const result = variables.get(inside);
      if (result instanceof Deck || result instanceof Hand)
        ands.push(cards.filter((card) => result.hasCard(card)));
      else if (result instanceof Array && result.length === 1) {
        const el = result.shift();
        if (el instanceof Deck || el instanceof Hand)
          ands.push(cards.filter((card) => el.hasCard(card)));
        else throw new Error("'inside' variable invalid type");
      } else throw new Error("'inside' variable invalid");
    } else {
      if (inside.minAmount !== 1 || inside.maxAmount !== 1)
        throw new Error("inside can only have minAmount and maxAmount of 1");
      const container = (
        await filterCardHolders(inside, variables, game)
      ).shift()!;
      ands.push(cards.filter((card) => container.hasCard(card)));
    }
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

async function filterDecks(
  {
    minAmount,
    maxAmount,
    filter: {
      actions,
      iterator_parameter,

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
  variables: VariableMap,
  game: Game
): Promise<Deck[]> {
  const decks = game.getAllDecks();
  const ands: Deck[][] = [];
  const not: Deck[] = [];

  // Filters
  if (actions) {
    ands.push(
      decks.filter(async (decks) => {
        if (iterator_parameter) {
          variables = { ...variables, [iterator_parameter]: decks };
          return await performActions(actions, variables, game);
        }
        return false;
      })
    );
  }

  if ($and)
    ands.push(
      ...(await Promise.all($and.map((f) => filterDecks(f, variables, game))))
    );
  if ($or)
    ands.push(
      (await Promise.all($or.map((f) => filterDecks(f, variables, game))))
        .reduce((acc, curr) => {
          return acc.concat(curr);
        }, [])
        .filter((d, i, a) => a.indexOf(d) === i)
    );
  if ($not) not.push(...(await filterDecks($not, variables, game)));

  if (has_all_of_tags)
    ands.push(decks.filter((d) => d.hasAllTags(has_all_of_tags)));

  if (has_one_of_tags)
    ands.push(decks.filter((d) => d.hasAnyTag(has_one_of_tags)));

  if (has_tag) ands.push(decks.filter((d) => d.hasTag(has_tag)));

  if (has_card) {
    if (has_card.minAmount !== 1 || has_card.maxAmount !== 1)
      throw new Error("has_card can only have minAmount and maxAmount of 1");
    const card = (await filterCards(has_card, variables, game)).shift()!;
    ands.push(decks.filter((d) => d.hasCard(card)));
  }

  if (has_x_of_cards) {
    const amount = has_x_of_cards.amount;
    const cards = await filterCards(has_x_of_cards.cards, variables, game);
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

export async function filterCardHolders(
  cardHolder: CardHolderFilterObject,
  variables: VariableMap,
  game: Game
): Promise<Deck[] | Hand[]> {
  switch (cardHolder.type) {
    case "filter:deck":
      return await filterDecks(cardHolder, variables, game);
    case "filter:hand":
      return await filterHands(cardHolder, variables, game);
  }
}

export function filterIsPlayerFilter(
  filter: Filter
): filter is PlayerFilterObject {
  return filter.type === "filter:player";
}
export function filterIsDeckFilter(filter: Filter): filter is DeckFilterObject {
  return filter.type === "filter:deck";
}
export function filterIsHandFilter(filter: Filter): filter is HandFilterObject {
  return filter.type === "filter:hand";
}
export function filterIsCardFilter(filter: Filter): filter is CardFilterObject {
  return filter.type === "filter:card";
}
