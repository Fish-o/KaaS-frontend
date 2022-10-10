import { Action, Variable } from "../lib/game/Actions";
import { Resolvable } from "../lib/game/Actions/resolvables";
import { Condition } from "../lib/game/Conditions";
import { Filter } from "../lib/game/Filters";

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

type ActionReturnsByType = {
  [K in Action["type"]]: Exclude<
    Extract<Action, { type: K }>["returns"],
    undefined
  >;
};

type EverythingByType = FiltersByType & ActionsByType & ConditionsByType;

// **DISCLAMER**: THIS IS THE BIGGEST FUCKING HACK. I'M SORRY.
// This is a hack to get around the fact that the type system doesn't allow for runtime shit.
// If you see an error make sure to do exactly what it says.
type FilterTypedObject<K extends keyof BT, BT> = {
  [K2 in keyof BT[K]]-?: //   EverythingByType[K][K2] extends PlayerResolvable ? ["required", "variable", "filter:player"] : // EverythingByType[K][K2] extends CardResolvable ? ["required", "variable", "filter:card"] : // EverythingByType[K][K2] extends CardHolderResolvable ? ["required", "variable", "filter:card", "filter:deck"] :
  //     EverythingByType[K][K2] extends HandResolvable ? ["required", "variable", "filter:hand"] :
  //       EverythingByType[K][K2] extends DeckResolvable ? ["required", "variable", "filter:deck"] :

  // EverythingByType[K][K2] extends Resolvable ? ["required", "variable", EverythingByType[K][K2]] :

  // BT[K][K2] extends Resolvable | string ? ["required", "variable", "string"] :
  BT[K][K2] extends Resolvable
    ? [
        "required",
        "variable",
        ...TuplifyUnion<Exclude<BT[K][K2], string | undefined>["type"]>
      ]
    : // EverythingByType[K][K2] extends `$${string}` ? ["required", "variable"] :
    BT[K][K2] extends string
    ?
        | ["required", "string"]
        | [
            "required",
            ...TuplifyUnion<`string:${Exclude<BT[K][K2], undefined>}`>
          ]
    : BT[K][K2] extends Action[]
    ? ["required", "array", "action"]
    : BT[K][K2] extends number
    ? ["required", "number"]
    : BT[K][K2] extends number | Variable
    ? ["required", "number", "variable"]
    : BT[K][K2] extends number | string
    ? ["required", "number", "string"]
    : BT[K][K2] extends Condition[]
    ? ["required", "array", "condition"]
    : BT[K][K2] extends Condition
    ? ["required", "condition"]
    : BT[K][K2] extends boolean
    ? ["required", "boolean"]
    : BT[K][K2] extends boolean | string | number
    ? ["required", "string", "number", "boolean"]
    : BT[K][K2] extends Action[] | undefined
    ? ["array", "action"]
    : BT[K][K2] extends Filter | undefined
    ? TuplifyUnion<Exclude<BT[K][K2], undefined>["type"]>
    : BT[K][K2] extends Filter[] | undefined
    ? ["array", ...TuplifyUnion<Exclude<BT[K][K2], undefined>[number]["type"]>]
    : BT[K][K2] extends string[] | undefined
    ? ["array", "string"]
    : BT[K][K2] extends `$${string}` | undefined
    ? ["variable"]
    : BT[K][K2] extends string | undefined
    ? ["string"] | TuplifyUnion<`string:${Exclude<BT[K][K2], undefined>}`>
    : BT[K][K2] extends Resolvable | undefined
    ? [
        "variable",
        ...TuplifyUnion<Exclude<BT[K][K2], string | undefined>["type"]>
      ]
    : BT[K][K2] extends number | undefined
    ? ["number"]
    : BT[K][K2] extends number | string | undefined
    ? ["number", "string"]
    : BT[K][K2] extends boolean | undefined
    ? ["boolean"]
    : BT[K][K2] extends Condition | undefined
    ? ["condition"]
    : BT[K][K2] extends Object | undefined
    ? {
        [K3 in keyof Exclude<BT[K][K2], undefined>]-?: Exclude<
          BT[K][K2],
          undefined
        >[K3] extends `$${string}`
          ? ["required", "variable"]
          : Exclude<BT[K][K2], undefined>[K3] extends string
          ?
              | ["required", "string"]
              | [
                  "required",
                  ...TuplifyUnion<`string:${Exclude<
                    Exclude<BT[K][K2], undefined>[K3],
                    undefined
                  >}`>
                ]
          : Exclude<BT[K][K2], undefined>[K3] extends Action[]
          ? ["required", "array", "action"]
          : Exclude<BT[K][K2], undefined>[K3] extends number
          ? ["required", "number"]
          : Exclude<BT[K][K2], undefined>[K3] extends number | string
          ? ["required", "number", "string"]
          : Exclude<BT[K][K2], undefined>[K3] extends Condition[]
          ? ["required", "array", "condition"]
          : Exclude<BT[K][K2], undefined>[K3] extends Condition
          ? ["required", "condition"]
          : Exclude<BT[K][K2], undefined>[K3] extends boolean
          ? ["required", "boolean"]
          : Exclude<BT[K][K2], undefined>[K3] extends boolean | string | number
          ? ["required", "string", "number", "boolean"]
          : Exclude<BT[K][K2], undefined>[K3] extends Action[] | undefined
          ? ["array", "action"]
          : Exclude<BT[K][K2], undefined>[K3] extends Filter | undefined
          ? TuplifyUnion<
              Exclude<Exclude<BT[K][K2], undefined>[K3], undefined>["type"]
            >
          : Exclude<BT[K][K2], undefined>[K3] extends Filter[] | undefined
          ? [
              "array",
              ...TuplifyUnion<
                Exclude<
                  Exclude<BT[K][K2], undefined>[K3],
                  undefined
                >[number]["type"]
              >
            ]
          : Exclude<BT[K][K2], undefined>[K3] extends string[] | undefined
          ? ["array", "string"]
          : Exclude<BT[K][K2], undefined>[K3] extends `$${string}` | undefined
          ? ["variable"]
          : Exclude<BT[K][K2], undefined>[K3] extends string | undefined
          ?
              | ["string"]
              | TuplifyUnion<`string:${Exclude<
                  Exclude<BT[K][K2], undefined>[K3],
                  undefined
                >}`>
          : Exclude<BT[K][K2], undefined>[K3] extends Resolvable | undefined
          ? [
              "variable",
              ...TuplifyUnion<
                Exclude<
                  Exclude<BT[K][K2], undefined>[K3],
                  string | undefined
                >["type"]
              >
            ]
          : Exclude<BT[K][K2], undefined>[K3] extends number | undefined
          ? ["number"]
          : Exclude<BT[K][K2], undefined>[K3] extends
              | number
              | string
              | undefined
          ? ["number", "string"]
          : Exclude<BT[K][K2], undefined>[K3] extends boolean | undefined
          ? ["boolean"]
          : Exclude<BT[K][K2], undefined>[K3] extends Condition | undefined
          ? ["condition"]
          : unknown;
      }
    : never;
  // EverythingByType[K][K2]
  // } : unknown
  // } : 'unknown'
};
// type FilterTypedObject<K extends keyof EverythingByType> = {
//   [K2 in keyof EverythingByType[K]]-?:
//   EverythingByType[K][K2] extends Object ? {
//     [K3 in keyof EverythingByType[K][K2]]-?:
//     EverythingByType[K][K2][K3]
//   } :
//   EverythingByType[K][K2]
// }

// type FilterTypedObject<K extends keyof EverythingByType> = {
//   [K2 in keyof EverythingByType[K]]-?:
//   EverythingByType[K][K2] }

// export let DescriptionForAllTheTypes:
//   {
//     [key in keyof EverythingByType[keyof EverythingByType]]: string
//   } =
//   deck:

// }

export let TypedNodeProperties: {
  [K in keyof EverythingByType]: FilterTypedObject<K, EverythingByType>;
} = {
  "filter:card": {
    $and: ["array", "filter:card"],
    $or: ["array", "filter:card"],
    $not: ["filter:card"],
    has_all_of_tags: ["array", "string"],
    has_one_of_tags: ["array", "string"],
    has_tag: ["string"],
    inside: ["variable", "filter:deck", "filter:hand"],
    iterator: {
      actions: ["array", "action"],
      parameter: ["variable"],
      condition: ["condition"],
    },
    has_property: {
      property: ["required", "string"],
      value: ["required", "string"],
    },
    maxAmount: ["required", "number"],
    minAmount: ["required", "number"],
  },
  "filter:deck": {
    $and: ["array", "filter:deck"],
    $or: ["array", "filter:deck"],
    $not: ["filter:deck"],
    has_all_of_tags: ["array", "string"],
    has_card: ["filter:card"],
    has_one_of_tags: ["array", "string"],
    has_tag: ["string"],
    has_x_of_cards: {
      amount: ["required", "number"],
      cards: ["filter:card"],
    },

    iterator: {
      actions: ["array", "action"],
      parameter: ["variable"],
      condition: ["condition"],
    },

    has_property: {
      property: ["required", "string"],
      value: ["required", "string"],
    },
    maxAmount: ["required", "number"],
    minAmount: ["required", "number"],
  },
  "filter:hand": {
    $and: ["array", "filter:hand"],
    $or: ["array", "filter:hand"],
    $not: ["filter:hand"],
    has_all_of_tags: ["array", "string"],
    has_one_of_tags: ["array", "string"],
    from_player: ["variable", "filter:player"],
    has_tag: ["string"],
    has_x_of_cards: {
      amount: ["required", "number"],
      cards: ["filter:card"],
    },
    has_card: ["filter:card"],
    iterator: {
      actions: ["array", "action"],
      parameter: ["variable"],
      condition: ["condition"],
    },

    has_property: {
      property: ["required", "string"],
      value: ["required", "string"],
    },
    maxAmount: ["required", "number"],
    minAmount: ["required", "number"],
  },
  "filter:player": {
    $and: ["array", "filter:player"],
    $or: ["array", "filter:player"],
    $not: ["filter:player"],
    has_all_of_tags: ["array", "string"],
    has_one_of_tags: ["array", "string"],
    has_tag: ["string"],
    has_hand: ["filter:hand"],
    iterator: {
      actions: ["array", "action"],
      parameter: ["variable"],
      condition: ["condition"],
    },

    has_property: {
      property: ["required", "string"],
      value: ["required", "string"],
    },
    maxAmount: ["required", "number"],
    minAmount: ["required", "number"],
  },
  "action:cards.move": {
    cards: ["required", "variable", "filter:card"],
    to: ["required", "variable", "filter:deck", "filter:hand"],
    where: ["string:top", "string:bottom", "string:random"],
  },
  "action:debug": {
    find: [
      "required",
      "variable",
      "filter:card",
      "filter:deck",
      "filter:hand",
      "filter:player",
    ],
  },
  "action:find.cards": {
    filter: ["required", "variable", "filter:card"],
  },
  "action:find.decks": {
    filter: ["required", "variable", "filter:deck"],
  },
  "action:find.hands": {
    filter: ["required", "variable", "filter:hand"],
  },
  "action:find.players": {
    filter: ["required", "variable", "filter:player"],
  },
  "action:logic.if": {
    condition: ["required", "condition"],
    false_actions: ["required", "array", "action"],
    true_actions: ["required", "array", "action"],
  },
  "action:logic.for_each": {
    actions: ["required", "array", "action"],
    as: ["required", "variable"],
    collection: [
      "required",
      "variable",
      "filter:card",
      "filter:deck",
      "filter:hand",
      "filter:player",
    ],
  },
  "action:logic.loop": {
    actions: ["required", "array", "action"],
    loops: ["required", "number"],
  },
  "action:data.get": {
    key: ["required", "string"],
    object: [
      "required",
      "variable",
      "filter:card",
      "filter:deck",
      "filter:hand",
      "filter:player",
    ],
  },
  "action:data.set": {
    key: ["required", "string"],
    object: [
      "required",
      "variable",
      "filter:card",
      "filter:deck",
      "filter:hand",
      "filter:player",
    ],
    value: ["required", "string", "number", "boolean"],
  },
  "action:user_input.select_players": {
    from: ["variable", "filter:player"],
    max: ["required", "number"],
    message: ["required", "string"],
    min: ["required", "number"],
    selector: ["required", "variable", "filter:player"],
  },
  "action:user_input.select_cards": {
    from: ["variable", "filter:card"],
    max: ["required", "number"],
    message: ["required", "string"],
    min: ["required", "number"],
    selector: ["required", "variable", "filter:player"],
  },
  "condition:amount": {
    a: ["required", "variable"],
    b: ["required", "number", "variable"],
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
    b: ["required", "string"],
    not: ["required", "boolean"],
    operator: ["required", "string:contains"],
  },
  "condition:type": {
    a: ["required", "variable"],
    b: ["required", "string"],
    not: ["required", "boolean"],
    operator: ["required", "string:is_type", "string:contains_type"],
  },
  "condition:data.single": {
    a: ["required", "variable"],
    b: ["required", "string"],
    key: ["required", "string"],
    not: ["required", "boolean"],
    operator: [
      "required",
      "string:contains",
      "string:=",
      "string:>",
      "string:<",
      "string:!=",
      "string:starts_with",
      "string:ends_with",
    ],
  },
  "condition:data.compare": {
    a: ["required", "variable"],
    b: ["required", "variable"],
    key: ["required", "string"],
    not: ["required", "boolean"],
    operator: [
      "required",
      "string:contains",
      "string:=",
      "string:>",
      "string:<",
      "string:!=",
      "string:starts_with",
      "string:ends_with",
    ],
  },

  "action:logic.return": {
    value: ["required", "boolean"],
  },
  "action:logic.break": {},

  "action:logic.method": {
    methodName: ["required", "string"],
  },

  "action:deck.shuffle": {
    deck: ["required", "variable", "filter:deck"],
  },
  "action:deck.draw": {
    count: ["required", "number"],
    deck: ["required", "variable", "filter:deck"],
    to: ["required", "variable", "filter:deck", "filter:hand"],
  },
};
export let TypedActionReturns: {
  [K in keyof ActionReturnsByType]: FilterTypedObject<K, ActionReturnsByType>;
} = {
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
  "action:user_input.select_cards": {
    selected: ["required", "variable"],
  },
  "action:user_input.select_players": {
    selected: ["variable"],
  },
};
