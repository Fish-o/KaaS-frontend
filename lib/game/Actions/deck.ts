import { Variable, VariableMap } from ".";
import {
  awaitEvent,
  broadcastGameEvent,
  SyncRandomSeedEvent,
} from "../../networking/events";
import { makeRandomString } from "../../random";
import { performFilter } from "../Filters";
import { Game } from "../Game";
import { Deck } from "../Objects/Deck";
import { BaseAction } from "./BaseAction";
import {
  CardHolderResolvable,
  DeckResolvable,
  resolveCardHolderResolvable,
  resolveDeckResolvable,
} from "./resolvables";

class BaseDeckAction extends BaseAction {
  type: `action:deck.${string}`;
}

class ActionDeckShuffle extends BaseDeckAction {
  type: "action:deck.shuffle";
  args: {
    deck: DeckResolvable;
  };
  returns?: Partial<{
    deck: Variable;
  }>;
}
class ActionDeckDraw extends BaseDeckAction {
  type: "action:deck.draw";
  args: {
    deck: DeckResolvable;
    count: number;
    to: CardHolderResolvable;
  };
  returns?: Partial<{
    deck: Variable;
  }>;
}

async function performDeckShuffleAction(
  { type, args: { deck }, returns }: ActionDeckShuffle,
  variables: VariableMap,
  game: Game
) {
  const decks = await resolveDeckResolvable(deck, variables, game, Infinity, 1);

  let randomSeed: string;
  if (game.is_host) {
    randomSeed = makeRandomString(32);

    await broadcastGameEvent(game, {
      event: "sync_random_seed",
      seed: randomSeed,
    });
  } else {
    const event = (await awaitEvent(
      game,
      "sync_random_seed"
    )) as SyncRandomSeedEvent;
    randomSeed = event.seed;
  }

  if (Array.isArray(decks)) {
    let i = 0;
    for (const deck of decks) {
      (deck as Deck).shuffleDeck(randomSeed + i.toString());
      i++;
    }
  } else {
    (decks as Deck).shuffleDeck(randomSeed);
  }
}
async function preformDeckDrawAction(
  { type, args: { deck, count, to }, returns }: ActionDeckDraw,
  variables: VariableMap,
  game: Game
) {
  const resolved_deck = (
    await resolveDeckResolvable(deck, variables, game, 1, 1)
  )[0];

  const holder = (
    await resolveCardHolderResolvable(to, variables, game, 1, 1)
  )[0];

  const cards = resolved_deck.grabCardsFromDeck(count);
  console.log("drawing", cards, "to", holder, "from", resolved_deck);
  if (cards.length !== count) throw new Error("Not enough cards in deck");
  for (const card of cards) {
    resolved_deck.removeCard(card);
    holder.addCard(card);
  }
}

export function preformDeckAction(
  action: DeckAction,
  variables: VariableMap,
  game: Game
) {
  switch (action.type) {
    case "action:deck.shuffle":
      return performDeckShuffleAction(action, variables, game);
    case "action:deck.draw":
      return preformDeckDrawAction(action, variables, game);
  }
}

export function actionIsDeckAction(
  action: BaseAction
): action is BaseDeckAction {
  return action.type.startsWith("action:deck.");
}

export type DeckAction = ActionDeckShuffle | ActionDeckDraw;
