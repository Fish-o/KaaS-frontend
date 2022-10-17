import { Action, Variable } from "../lib/game/Actions";
import {
  CardHolderResolvable,
  Resolvable,
} from "../lib/game/Actions/resolvables";
import { Condition } from "../lib/game/Conditions";
import { Filter } from "../lib/game/Filters";
import { UserInput } from "../lib/game/Input";

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;
type LastOf<T> = UnionToIntersection<
  T extends any ? () => T : never
> extends () => infer R
  ? R
  : never;

type Push<T extends any[], V> = [...T, V];
type TuplifyUnion<
  T,
  L = LastOf<T>,
  N = [T] extends [never] ? true : false
> = true extends N ? [] : Push<TuplifyUnion<Exclude<T, L>>, L>;
type Full<T> = {
  [P in keyof T]-?: T[P];
};

// return useMemo(() => {
type FiltersByType = {
  [K in Filter["type"]]: Extract<Filter, { type: K }>["filter"];
};
type ActionsByType = {
  [K in Action["type"]]: Extract<Action, { type: K }>["args"];
};
type ConditionsByType = {
  [K in Condition["type"]]: Extract<Condition, { type: K }>["condition"];
};

type InputsByType = {
  [K in UserInput["type"]]: Extract<UserInput, { type: K }>["input"];
};

type ActionReturnsByType = {
  [K in Action["type"]]: Exclude<
    Extract<Action, { type: K }>["returns"],
    undefined
  >;
};

type EverythingByType = FiltersByType &
  ActionsByType &
  ConditionsByType &
  InputsByType;

type PushFront<TailT extends any[], HeadT> = ((
  head: HeadT,
  ...tail: TailT
) => void) extends (...arr: infer ArrT) => void
  ? ArrT
  : never;

type CalculatePermutations<U extends string, ResultT extends any[] = []> = {
  [k in U]: [Exclude<U, k>] extends [never]
    ? PushFront<ResultT, k>
    : CalculatePermutations<Exclude<U, k>, PushFront<ResultT, k>>;
}[U];
type UnionHasType<T, U> = (T extends U ? true : never) extends never
  ? false
  : true;

type HandleArrayRequired<T> = [UnionHasType<T, undefined>] extends [false]
  ? [Exclude<T, undefined>] extends [Array<infer U>]
    ? [
        "required",
        "array",
        ...TuplifyUnion<DecodedBasicType<Exclude<U, undefined>>>
      ]
    : ["required", ...TuplifyUnion<DecodedBasicType<Exclude<T, undefined>>>]
  : [Exclude<T, undefined>] extends [Array<infer U>]
  ? ["array", ...TuplifyUnion<DecodedBasicType<Exclude<U, undefined>>>]
  : [DecodedBasicType<Exclude<T, undefined>>] extends [never]
  ? never
  : TuplifyUnion<DecodedBasicType<Exclude<T, undefined>>>;

type RecursiveSolve<T> = HandleArrayRequired<T> extends never
  ? { [K in keyof T]-?: RecursiveSolve<T[K]> }
  : // @ts-ignore
    CalculatePermutations<HandleArrayRequired<T>[number]>;

type FilterTypedObject<K extends keyof BT, BT> = {
  [K2 in keyof BT[K]]-?: RecursiveSolve<BT[K][K2]>;
};

// prettier-ignore
type DecodedBasicType<T> = 
[Filter | `$${string}`] extends [T] ? "filter" | "variable"
: T extends number                       ? "number"
: T extends boolean                    ? "boolean"
: T extends `$${string}`                ? "variable"
: T extends string                     ? `string:${Exclude<T, undefined>}`
: T extends Action                     ? "action"
: T extends Condition                  ? "condition"
: T extends UserInput                  ? "input"
: T extends Filter                     ? T["type"]
: never

type TypedObject<T> = {
  [K in keyof T]: FilterTypedObject<K, T>;
};

type DefaultsTypedObject<BT> = {
  [K2 in keyof BT]?: DefaultsTypedObject<BT[K2]>;
};

// *DISCLAMER*: THIS IS THE BIGGEST FUCKING HACK. I'M SORRY.
// This is a hack to get around the fact that the type system doesn't allow for runtime shit.
// If you see an error make sure to do exactly what it says.

export let FilterNodeProperties: TypedObject<FiltersByType> = {
  "filter:card": {
    $and: ["array", "variable", "filter:card"],
    $or: ["array", "variable", "filter:card"],
    $not: ["variable", "filter:card"],
    has_all_of_tags: ["array", "string:"],
    has_one_of_tags: ["array", "string:"],
    has_tag: ["string:"],
    inside: ["variable", "filter:deck", "filter:hand"],
    iterator: {
      actions: ["array", "action"],
      parameter: ["variable"],
      condition: ["condition"],
    },
    has_property: {
      property: ["required", "string:"],
      value: ["required", "string:"],
    },
    maxAmount: ["required", "number"],

    minAmount: ["required", "number"],
  },
  "filter:deck": {
    $and: ["array", "variable", "filter:deck"],
    $or: ["array", "variable", "filter:deck"],
    $not: ["variable", "filter:deck"],
    has_all_of_tags: ["array", "string:"],
    has_card: ["filter:card"],
    has_one_of_tags: ["array", "string:"],
    has_tag: ["string:"],
    has_x_of_cards: {
      amount: ["required", "number"],
      cards: ["required", "filter:card"],
    },

    iterator: {
      actions: ["array", "action"],
      parameter: ["variable"],
      condition: ["condition"],
    },

    has_property: {
      property: ["required", "string:"],
      value: ["required", "string:"],
    },
    maxAmount: ["required", "number"],
    minAmount: ["required", "number"],
  },
  "filter:hand": {
    $and: ["array", "variable", "filter:hand"],
    $or: ["array", "variable", "filter:hand"],
    $not: ["variable", "filter:hand"],
    has_all_of_tags: ["array", "string:"],
    has_one_of_tags: ["array", "string:"],
    from_player: ["variable", "filter:player"],
    has_tag: ["string:"],
    has_x_of_cards: {
      amount: ["required", "number"],
      cards: ["required", "filter:card"],
    },
    has_card: ["filter:card"],
    iterator: {
      actions: ["array", "action"],
      parameter: ["variable"],
      condition: ["condition"],
    },

    has_property: {
      property: ["required", "string:"],
      value: ["required", "string:"],
    },
    maxAmount: ["required", "number"],
    minAmount: ["required", "number"],
  },
  "filter:player": {
    $and: ["array", "variable", "filter:player"],
    $or: ["array", "variable", "filter:player"],
    $not: ["variable", "filter:player"],
    has_all_of_tags: ["array", "string:"],
    has_one_of_tags: ["array", "string:"],
    has_tag: ["string:"],
    has_hand: ["filter:hand"],
    iterator: {
      actions: ["array", "action"],
      parameter: ["variable"],
      condition: ["condition"],
    },

    has_property: {
      property: ["required", "string:"],
      value: ["required", "string:"],
    },
    maxAmount: ["required", "number"],
    minAmount: ["required", "number"],
  },
};

export let ActionNodeProperties: TypedObject<ActionsByType> = {
  "action:cards.move": {
    cards: ["required", "filter:card", "variable"],
    to: ["required", "variable", "filter:deck", "filter:hand"],
    where: ["string:top", "string:bottom", "string:random"],
  },
  "action:debug": {
    find: ["required", "variable", "filter"],
  },
  "action:find.cards": {
    filter: ["required", "filter:card"],
  },
  "action:find.decks": {
    filter: ["required", "filter:deck"],
  },
  "action:find.hands": {
    filter: ["required", "filter:hand"],
  },
  "action:find.players": {
    filter: ["required", "filter:player"],
  },
  "action:logic.if": {
    condition: ["required", "condition"],
    false_actions: ["required", "array", "action"],
    true_actions: ["required", "array", "action"],
  },
  "action:logic.for_each": {
    actions: ["required", "array", "action"],
    as: ["required", "variable"],
    collection: ["required", "variable", "filter"],
  },
  "action:logic.loop": {
    actions: ["required", "array", "action"],
    loops: ["required", "number"],
  },
  "action:data.get": {
    key: ["required", "string:"],
    object: ["required", "variable", "filter"],
  },
  "action:data.set": {
    key: ["required", "string:"],
    object: ["required", "variable", "filter"],
    value: ["required", "string:"],
  },
  "action:user_input": {
    inputs: ["required", "array", "input"],
    operation: ["required", "string:all", "string:any"],
  },
  "action:logic.return": {
    value: ["required", "boolean"],
  },
  "action:logic.break": {},
  "action:logic.method": {
    methodName: ["required", "string:"],
  },
  "action:deck.shuffle": {
    deck: ["required", "variable", "filter:deck"],
  },
  "action:deck.draw": {
    count: ["required", "number"],
    deck: ["required", "variable", "filter:deck"],
    to: ["required", "variable", "filter:hand", "filter:deck"],
  },
  "action:game.win": {
    losers: ["variable", "filter:player"],
    winners: ["required", "variable", "filter:player"],
  },
};

export let ConditionNodeProperties: TypedObject<ConditionsByType> = {
  "condition:amount": {
    a: ["required", "variable"],
    b: ["required", "variable", "number"],
    operator: ["required", "string:=", "string:>", "string:<"],
    not: ["required", "boolean"],
  },
  "condition:array": {
    a: ["required", "variable"],
    b: ["required", "variable"],
    operator: ["required", "string:contains"],
    not: ["required", "boolean"],
  },
  "condition:meta": {
    conditions: ["required", "array", "condition"],
    not: ["required", "boolean"],
    operator: ["required", "string:and", "string:or"],
  },
  "condition:object": {
    a: ["required", "variable"],
    b: ["required", "variable"],
    not: ["required", "boolean"],
    operator: ["required", "string:contains", "string:is"],
  },
  "condition:tags": {
    a: ["required", "variable"],
    b: ["required", "string:"],
    not: ["required", "boolean"],
    operator: ["required", "string:contains"],
  },
  "condition:type": {
    a: ["required", "variable"],
    b: [
      "required",
      "variable",
      "string:deck",
      "string:card",
      "string:hand",
      "string:player",
    ],
    not: ["required", "boolean"],
    operator: ["required", "string:is_type", "string:contains_type"],
  },
  "condition:data.single": {
    a: ["required", "variable"],
    b: ["required", "string:"],
    key: ["required", "string:"],
    not: ["required", "boolean"],
    operator: [
      "required",
      "string:=",
      "string:>",
      "string:<",
      "string:contains",
      "string:!=",
      "string:starts_with",
      "string:ends_with",
    ],
  },
  "condition:data.compare": {
    a: ["required", "variable"],
    b: ["required", "variable"],
    key: ["required", "string:"],
    not: ["required", "boolean"],
    operator: [
      "required",
      "string:=",
      "string:>",
      "string:<",
      "string:contains",
      "string:!=",
      "string:starts_with",
      "string:ends_with",
    ],
  },
};

export let InputNodeProperties: TypedObject<InputsByType> = {
  "input:select_cards": {
    from: ["variable", "filter:card"],
    max: ["required", "number"],
    message: ["required", "string:"],
    min: ["required", "number"],
    selector: ["required", "variable", "filter:player"],
    actions: ["required", "array", "action"],
  },
  "input:select_players": {
    from: ["variable", "filter:player"],
    max: ["required", "number"],
    message: ["required", "string:"],
    min: ["required", "number"],
    selector: ["required", "variable", "filter:player"],
    actions: ["required", "array", "action"],
  },
};

export let TypedActionReturns: TypedObject<ActionReturnsByType> = {
  "action:cards.move": {
    destination: ["variable"],
    moved_cards: ["variable"],
  },
  "action:data.get": {
    value: ["required", "variable"],
  },
  "action:data.set": {},
  "action:debug": {},
  "action:deck.draw": {
    deck: ["variable"],
  },
  "action:deck.shuffle": {
    deck: ["variable"],
  },
  "action:find.cards": {
    found_many: ["variable"],
    found_one: ["variable"],
  },
  "action:find.decks": {
    found_many: ["variable"],
    found_one: ["variable"],
  },
  "action:find.hands": {
    found_many: ["variable"],
    found_one: ["variable"],
  },
  "action:find.players": {
    found_many: ["variable"],
    found_one: ["variable"],
  },
  "action:logic.break": {},
  "action:logic.for_each": {},
  "action:logic.if": {},
  "action:logic.loop": {},
  "action:logic.return": {},
  "action:logic.method": {},
  "action:user_input": {},
  "action:game.win": {
    winner: ["required", "variable"],
  },
};

export let DefaultValueNodeProperties: DefaultsTypedObject<EverythingByType> = {
  "filter:card": {
    iterator: {
      parameter: "$card",
    },
    maxAmount: 99999999,
    minAmount: 1,
  },
  "filter:deck": {
    iterator: {
      parameter: "$deck",
    },
  },
  "filter:hand": {
    iterator: {
      parameter: "$hand",
    },

    maxAmount: 99999999,
    minAmount: 1,
  },
  "filter:player": {
    iterator: {
      parameter: "$player",
    },
  },
};

export function isValidType(type: string): type is keyof EverythingByType {
  if (type in FilterNodeProperties) {
    return true;
  }
  if (type in ActionNodeProperties) {
    return true;
  }
  if (type in ConditionNodeProperties) {
    return true;
  }
  if (type in InputNodeProperties) {
    return true;
  }
  return false;
}