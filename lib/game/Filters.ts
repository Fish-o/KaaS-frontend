import { DebugContext, debugLog } from ".";
import { Action, performActions, Variable, VariableMap } from "./Actions";
import {
  CardHolderResolvable,
  PlayerResolvable,
  resolveCardHolderResolvable,
} from "./Actions/resolvables";
import { Condition, performCondition } from "./Conditions";
import { Game, isValidVariableName } from "./Game";
import { BaseGameObject } from "./Objects";
import { Card } from "./Objects/Card";
import { Deck } from "./Objects/Deck";
import { Hand, Player } from "./Objects/Player";

interface FilterObject {
  type: `filter:${string}`;

  filter: {
    maxAmount: number;
    minAmount: number;
  } & { [key: string]: any };
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

    has_property: {
      property: string;
      value: string;
    };
    iterator: {
      parameter?: Variable;
      actions?: Action[];
      condition?: Condition;
    };
  }> & {
    maxAmount: number;
    minAmount: number;
  };
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

    has_property: {
      property: string;
      value: string;
    };
    iterator: {
      parameter?: Variable;
      actions?: Action[];
      condition?: Condition;
    };
  }> & {
    maxAmount: number;
    minAmount: number;
  };
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

    has_property: {
      property: string;
      value: string;
    };
    iterator: {
      parameter?: Variable;
      actions?: Action[];
      condition?: Condition;
    };
  }> & {
    maxAmount: number;
    minAmount: number;
  };
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

    has_property: {
      property: string;
      value: string;
    };
    iterator: {
      parameter?: Variable;
      actions?: Action[];
      condition?: Condition;
    };
  }> & {
    maxAmount: number;
    minAmount: number;
  };
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
  game: Game,
  debugContext: DebugContext
): Promise<Deck[]>;
export async function performFilter(
  filter: PlayerFilterObject,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<Player[]>;
export async function performFilter(
  filter: HandFilterObject,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<Hand[]>;
export async function performFilter(
  filter: CardFilterObject,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<Card[]>;
export async function performFilter(
  filter: Filter,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<BaseGameObject[]>;
export async function performFilter(
  filter: Filter,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<any> {
  switch (filter.type) {
    case "filter:deck":
      return await filterDecks(filter, variables, game, debugContext);
    case "filter:player":
      return await filterPlayers(filter, variables, game, debugContext);
    case "filter:hand":
      return await filterHands(filter, variables, game, debugContext);
    case "filter:card":
      return await filterCards(filter, variables, game, debugContext);
  }
}

async function asyncFilter<T>(
  arr: readonly T[],
  predicate: (arg0: T) => Promise<boolean | void | null>
) {
  const results = await Promise.all(arr.map(predicate));

  return arr.filter((_v, index) => results[index]);
}
async function handleIterator<T extends BaseGameObject>(
  ands: T[][],
  objects: readonly T[],
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext,
  iterator: Filter["filter"]["iterator"]
) {
  console.log("Handling iterator", iterator, variables);
  if (iterator) {
    const { actions, parameter, condition } = iterator;
    if (actions) {
      ands.push(
        await asyncFilter<T>(objects, async (object) => {
          if (parameter) {
            variables.set(parameter, object);
          }
          let result = await performActions(
            actions,
            variables,
            game,
            debugContext
          );
          if (parameter) {
            variables.delete(parameter);
          }
          return result;
        })
      );
    }

    if (condition) {
      ands.push(
        await asyncFilter<T>(objects, async (object) => {
          let newVars = new Map(variables);
          if (parameter) {
            newVars.set(parameter, object);
          }
          let result = await performCondition(
            condition,
            newVars,
            game,
            debugContext
          );
          return result;
        })
      );
    }
  }
}

async function filterPlayers(
  {
    filter: {
      minAmount,
      maxAmount,
      iterator,
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
  game: Game,
  debugContext: DebugContext
): Promise<Player[]> {
  debugContext = {
    ...debugContext,
    depth: debugContext.depth + 1,
  };
  debugLog("Filtering players", debugContext, {
    minAmount,
    maxAmount,
    iterator,
    $and,
    $not,
    $or,
    has_hand,
    has_all_of_tags,
    has_one_of_tags,
    has_tag,
  });

  const players = game.getAllPlayers();
  const ands: Player[][] = [];
  const not: Player[] = [];

  await handleIterator(ands, players, variables, game, debugContext, iterator);

  if (has_all_of_tags)
    ands.push(players.filter((p) => p.hasAllTags(has_all_of_tags)));

  if (has_one_of_tags)
    ands.push(players.filter((p) => p.hasAnyTag(has_one_of_tags)));

  if (has_tag) ands.push(players.filter((p) => p.hasTag(has_tag)));

  if (has_hand) {
    if (has_hand.filter.minAmount !== 1 || has_hand.filter.maxAmount !== 1)
      throw new Error("has_hand can only have minAmount and maxAmount of 1");
    const hand = (
      await filterHands(has_hand, variables, game, debugContext)
    ).shift()!;
    ands.push(players.filter((p) => p.hasHand(hand)));
  }

  if ($and)
    ands.push(
      ...(await Promise.all(
        $and.map((f) => filterPlayers(f, variables, game, debugContext))
      ))
    );

  if ($or)
    ands.push(
      (
        await Promise.all(
          $or.map((f) => filterPlayers(f, variables, game, debugContext))
        )
      )
        .reduce((acc, curr) => {
          return acc.concat(curr);
        }, [])
        .filter((p) => p !== undefined)
        .filter((p, i, a) => a.indexOf(p) === i)
    );

  if ($not)
    not.push(...(await filterPlayers($not, variables, game, debugContext)));

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
    iterator,
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
    filter: {
      minAmount,
      maxAmount,
      iterator,
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
  game: Game,
  debugContext: DebugContext
): Promise<Hand[]> {
  debugLog("Filtering hands", debugContext, {
    minAmount,
    maxAmount,
    iterator,
    $and,
    $not,
    $or,
    from_player,
    has_all_of_tags,
    has_one_of_tags,
    has_tag,
    has_card,
    has_x_of_cards,
  });

  const hands = game.getAllHands();
  const ands: Hand[][] = [];
  const not: Hand[] = [];

  await handleIterator(ands, hands, variables, game, debugContext, iterator);

  if ($and)
    ands.push(
      ...(await Promise.all(
        $and.map((f) => filterHands(f, variables, game, debugContext))
      ))
    );
  if ($or)
    ands.push(
      (
        await Promise.all(
          $or.map((f) => filterHands(f, variables, game, debugContext))
        )
      )
        .reduce((acc, curr) => {
          return acc.concat(curr);
        }, [])
        .filter((h, i, a) => a.indexOf(h) === i)
    );
  if ($not)
    not.push(...(await filterHands($not, variables, game, debugContext)));

  if (from_player && typeof from_player !== "string") {
    if (
      from_player.filter.minAmount !== 1 ||
      from_player.filter.maxAmount !== 1
    )
      throw new Error("from_player can only have minAmount and maxAmount of 1");
    const player = (
      await filterPlayers(from_player, variables, game, debugContext)
    ).shift()!;
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
    if (has_card.filter.minAmount !== 1 || has_card.filter.maxAmount !== 1)
      throw new Error("has_card can only have minAmount and maxAmount of 1");

    const card = (
      await filterCards(has_card, variables, game, debugContext)
    ).shift()!;
    ands.push(hands.filter((h) => h.hasCard(card)));
  }

  if (has_x_of_cards?.cards) {
    const amount = has_x_of_cards.amount;
    const cards = await filterCards(
      has_x_of_cards.cards,
      variables,
      game,
      debugContext
    );
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
  debugLog("Filtered Hand", debugContext, filteredHands);
  return filteredHands;
}

async function filterCards(
  {
    filter: {
      maxAmount,
      minAmount,
      iterator,
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
  game: Game,
  debugContext: DebugContext
): Promise<Card[]> {
  debugContext = { ...debugContext, depth: debugContext.depth + 1 };
  debugLog(
    "Filtering cards",
    debugContext,
    {
      maxAmount,
      minAmount,
      iterator,
      $and,
      $not,
      $or,
      has_all_of_tags,
      has_one_of_tags,
      has_tag,
      inside,
    },
    variables
  );

  const cards = game.getAllCards();
  const ands: Card[][] = [];
  const not: Card[] = [];

  await handleIterator(ands, cards, variables, game, debugContext, iterator);

  if ($and)
    ands.push(
      ...(await Promise.all(
        $and.map((f) => filterCards(f, variables, game, debugContext))
      ))
    );
  if ($or)
    ands.push(
      (
        await Promise.all(
          $or.map((f) => filterCards(f, variables, game, debugContext))
        )
      )
        .reduce((acc, curr) => {
          return acc.concat(curr);
        }, [])
        .filter((c, i, a) => a.indexOf(c) === i)
    );
  if ($not)
    not.push(...(await filterCards($not, variables, game, debugContext)));

  if (has_all_of_tags)
    ands.push(cards.filter((c) => c.hasAllTags(has_all_of_tags)));

  if (has_one_of_tags)
    ands.push(cards.filter((c) => c.hasAnyTag(has_one_of_tags)));

  if (has_tag) ands.push(cards.filter((c) => c.hasTag(has_tag)));

  if (inside) {
    console.log("inside", inside);
    const results = await resolveCardHolderResolvable(
      inside,
      variables,
      game,
      debugContext
    );
    console.log("inside", results);

    results.forEach((result) => {
      ands.push(cards.filter((card) => result.hasCard(card)));
    });
  }
  console.log("Final ands", ands);
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
    filter: {
      minAmount,
      maxAmount,
      iterator,

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
  game: Game,
  debugContext: DebugContext
): Promise<Deck[]> {
  debugContext = { ...debugContext, depth: debugContext.depth + 1 };
  debugLog("Filtering deck", debugContext, {
    minAmount,
    maxAmount,
    iterator,

    $and,
    $not,
    $or,
    has_all_of_tags,
    has_one_of_tags,
    has_tag,
    has_x_of_cards,
    has_card,
  });

  const decks = game.getAllDecks();
  const ands: Deck[][] = [];
  const not: Deck[] = [];

  await handleIterator(ands, decks, variables, game, debugContext, iterator);

  if ($and)
    ands.push(
      ...(await Promise.all(
        $and.map((f) => filterDecks(f, variables, game, debugContext))
      ))
    );
  if ($or)
    ands.push(
      (
        await Promise.all(
          $or.map((f) => filterDecks(f, variables, game, debugContext))
        )
      )
        .reduce((acc, curr) => {
          return acc.concat(curr);
        }, [])
        .filter((d, i, a) => a.indexOf(d) === i)
    );
  if ($not)
    not.push(...(await filterDecks($not, variables, game, debugContext)));

  if (has_all_of_tags)
    ands.push(decks.filter((d) => d.hasAllTags(has_all_of_tags)));

  if (has_one_of_tags)
    ands.push(decks.filter((d) => d.hasAnyTag(has_one_of_tags)));

  if (has_tag) ands.push(decks.filter((d) => d.hasTag(has_tag)));

  if (has_card) {
    if (has_card.filter.minAmount !== 1 || has_card.filter.maxAmount !== 1)
      throw new Error("has_card can only have minAmount and maxAmount of 1");
    const card = (
      await filterCards(has_card, variables, game, debugContext)
    ).shift()!;
    ands.push(decks.filter((d) => d.hasCard(card)));
  }

  if (has_x_of_cards) {
    const amount = has_x_of_cards.amount;
    const cards = await filterCards(
      has_x_of_cards.cards,
      variables,
      game,
      debugContext
    );
    ands.push(decks.filter((d) => d.hasXOfCards(amount, cards)));
  }
  debugLog("Filtered Deck", debugContext, decks);

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
  debugLog("Filtered Deck", debugContext, [...filteredDecks]);

  return filteredDecks;
}

export async function filterCardHolders(
  cardHolder: CardHolderFilterObject,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<Deck[] | Hand[]> {
  switch (cardHolder.type) {
    case "filter:deck":
      return await filterDecks(cardHolder, variables, game, debugContext);
    case "filter:hand":
      return await filterHands(cardHolder, variables, game, debugContext);
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
