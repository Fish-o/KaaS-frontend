import { min } from "lodash";
import { Variable, VariableMap } from ".";
import { DebugContext } from "..";
import {
  CardHolderFilterObject,
  CardFilterObject,
  PlayerFilterObject,
  DeckFilterObject,
  HandFilterObject,
  performFilter,
} from "../Filters";
import { Game } from "../Game";
import { BaseGameObject } from "../Objects";
import { Card } from "../Objects/Card";
import { Deck } from "../Objects/Deck";
import { Hand, Player } from "../Objects/Player";

export type CardResolvable = CardFilterObject | Variable;
export type PlayerResolvable = PlayerFilterObject | Variable;
export type DeckResolvable = DeckFilterObject | Variable;
export type HandResolvable = HandFilterObject | Variable;
export type CardHolderResolvable = CardHolderFilterObject | Variable;
export type Resolvable =
  | PlayerResolvable
  | CardResolvable
  | DeckResolvable
  | HandResolvable
  | CardHolderResolvable;

export async function resolvePlayerResolvable(
  resolvable: PlayerResolvable | undefined,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext,
  min: number = 0,
  max: number = Infinity
) {
  console.log(
    "resolvePlayerResolvable",
    resolvable,
    variables,
    game,
    debugContext,
    min,
    max
  );
  let players: any[] | any = resolvable
    ? typeof resolvable === "string"
      ? variables.get(resolvable)
      : await performFilter(resolvable, variables, game, debugContext)
    : [...game.getAllPlayers()];
  if (typeof players !== "object") throw new Error("Invalid players");
  else if (Array.isArray(players)) {
    if (players.length < min) throw new Error("Not enough players");
    if (players.length > max) throw new Error("Too many players");
    if (players.some((p) => !(p instanceof Player)))
      throw new Error("Non player object(s) in player selector");
  } else {
    if (!(players instanceof Player))
      throw new Error("Non player object in player selector");
    players = [players];
  }
  return players as Player[];
}

export async function resolveCardResolvable(
  resolvable: CardResolvable | undefined,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext,
  max: number = Infinity,
  min: number = 0
) {
  let cards: any[] | any = resolvable
    ? typeof resolvable === "string"
      ? variables.get(resolvable)
      : await performFilter(resolvable, variables, game, debugContext)
    : [...game.getAllCards()];
  if (typeof cards !== "object") throw new Error("Invalid cards");
  else if (Array.isArray(cards)) {
    if (cards.length < min) throw new Error("Not enough cards");
    if (cards.length > max) throw new Error("Too many cards");
    if (cards.some((p) => !(p instanceof Card)))
      throw new Error("Non card object(s) in card selector");
  } else {
    if (!(cards instanceof Card))
      throw new Error("Non card object in card selector");
    cards = [cards];
  }
  return cards as Card[];
}

export async function resolveDeckResolvable(
  resolvable: DeckResolvable,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext,
  max: number = Infinity,
  min: number = 0
) {
  let decks: any[] | any = resolvable
    ? typeof resolvable === "string"
      ? variables.get(resolvable)
      : await performFilter(resolvable, variables, game, debugContext)
    : [...game.getAllDecks()];
  if (typeof decks !== "object") throw new Error("Invalid decks");
  else if (Array.isArray(decks)) {
    if (decks.length < min) throw new Error("Not enough decks");
    if (decks.length > max) throw new Error("Too many decks");
    if (decks.some((p) => !(p instanceof Deck)))
      throw new Error("Non deck object(s) in deck selector");
  } else {
    if (!(decks instanceof Deck))
      throw new Error("Non deck object in deck selector");
    decks = [decks];
  }
  return decks as Deck[];
}

export async function resolveHandResolvable(
  resolvable: HandResolvable,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext,
  max: number = Infinity,
  min: number = 0
) {
  let hands: any[] | any = resolvable
    ? typeof resolvable === "string"
      ? variables.get(resolvable)
      : await performFilter(resolvable, variables, game, debugContext)
    : [...game.getAllHands()];
  if (typeof hands !== "object") throw new Error("Invalid hands");
  else if (Array.isArray(hands)) {
    if (hands.length < min) throw new Error("Not enough hands");
    if (hands.length > max) throw new Error("Too many hands");
    if (hands.some((p) => !(p instanceof Hand)))
      throw new Error("Non hand object(s) in hand selector");
  } else {
    if (!(hands instanceof Hand))
      throw new Error("Non hand object in hand selector");
    hands = [hands];
  }
  return hands as Hand[];
}

export async function resolveCardHolderResolvable(
  resolvable: CardHolderResolvable,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext,
  max: number = Infinity,
  min: number = 0
) {
  let cardHolders: any[] | any = resolvable
    ? typeof resolvable === "string"
      ? variables.get(resolvable)
      : await performFilter(resolvable, variables, game, debugContext)
    : [...game.getAllHands(), ...game.getAllDecks()];
  if (typeof cardHolders !== "object") throw new Error("Invalid card holders");
  else if (Array.isArray(cardHolders)) {
    if (cardHolders.length < min) throw new Error("Not enough card holders");
    if (cardHolders.length > max) throw new Error("Too many card holders");
    if (cardHolders.some((p) => !(p instanceof Hand) && !(p instanceof Deck)))
      throw new Error("Non card holder object(s) in card holder selector");
  } else {
    if (!(cardHolders instanceof Hand) && !(cardHolders instanceof Deck))
      throw new Error("Non card holder object in card holder selector");
    cardHolders = [cardHolders];
  }
  return cardHolders as Hand[] | Deck[];
}

export async function resolveBaseObject(
  resolvable: Resolvable,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext,
  max: number = Infinity,
  min: number = 0
) {
  let objects: any[] | any = resolvable
    ? typeof resolvable === "string"
      ? variables.get(resolvable)
      : await performFilter(resolvable, variables, game, debugContext)
    : [];

  if (typeof objects !== "object") throw new Error("Invalid BaseObject");
  else if (Array.isArray(objects)) {
    if (objects.length < min) throw new Error("Not enough hands");
    if (objects.length > max) throw new Error("Too many hands");
    if (
      objects.some(
        (p) =>
          !(p instanceof Hand) &&
          !(p instanceof Deck) &&
          !(p instanceof Card) &&
          !(p instanceof Player)
      )
    )
      throw new Error("Non BaseObjects in hand selector");
  } else {
    if (
      !(objects instanceof Hand) &&
      !(objects instanceof Deck) &&
      !(objects instanceof Card) &&
      !(objects instanceof Player)
    )
      throw new Error("Non BaseObjects in hand selector");

    objects = [objects];
  }
  return objects as BaseGameObject[];
}
