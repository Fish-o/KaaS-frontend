import { Card } from "./Card";

export enum BundleType {
  standard_52 = "standard_52",
  standard_54 = "standard_54",
}

function ResolveBundle(bundle: BundleType, makeID: () => string): Card[] {
  switch (bundle) {
    case BundleType.standard_52:
      return ResolveStandard52(makeID);
    case BundleType.standard_54:
      return ResolveStandard54(makeID);
  }
}
function ResolveStandard52(makeID: () => string): Card[] {
  const suits = [
    ["spades", "S"],
    ["hearts", "H"],
    ["diamonds", "D"],
    ["clubs", "C"],
  ];
  const ranks = [
    ["ace", "ace"],
    ["two", "2"],
    ["three", "3"],
    ["four", "4"],
    ["five", "5"],
    ["six", "6"],
    ["seven", "7"],
    ["eight", "8"],
    ["nine", "9"],
    ["ten", "10"],
    ["jack", "jack"],
    ["queen", "queen"],
    ["king", "king"],
  ];
  const cards: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      cards.push(
        new Card({
          name: `${rank[1]}${suit[1]}`,
          tags: [suit[0], rank[0]],
          description: `The ${rank[0]} of ${suit[0]}`,
          image_name: `${rank[1]}_of_${suit[0]}.png`,
          data: {
            suit: suit[0],
            rank: rank[0],
          },
          id: makeID(),
        })
      );
    }
  }
  return cards;
}

function ResolveStandard54(makeID: () => string): Card[] {
  const cards = ResolveStandard52(makeID);
  for (let i = 0; i < 2; i++) {
    cards.push(
      new Card({
        name: "joker",
        tags: ["joker"],
        description: "The joker",
        data: {
          suit: "joker",
          rank: "joker",
        },
        id: makeID(),
      })
    );
  }
  return cards;
}

export function ResolveBundles(
  bundles: BundleType[],
  makeID: () => string
): Card[] {
  const cards: Card[] = [];
  for (const bundle of bundles) {
    cards.push(...ResolveBundle(bundle, makeID));
  }
  return cards;
}
