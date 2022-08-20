import {
  Action,
  BaseAction,
  CardHolderResolvable,
  CardResolvable,
  Variable,
  VariableMap,
  VariableTypes,
} from ".";
import { performEvent } from "../Events";
import { performFilter, filterCardHolders } from "../Filters";
import { Game, isValidVariableName } from "../Game";
import { getCardSource } from "../Objects";
import { Card } from "../Objects/Card";
import { Deck } from "../Objects/Deck";
import { Hand } from "../Objects/Player";
class BaseCardAction extends BaseAction {
  type: `action:cards.${string}`;
}
class ActionMoveCards extends BaseCardAction {
  type: "action:cards.move";
  args: {
    cards: CardResolvable;
    to: CardHolderResolvable;
    where?: "top" | "bottom" | "random";
  };
  returns?: Partial<{
    moved_cards: Variable;
    destination: Variable;
  }>;
}

function performMoveCardsAction(
  { type, args: { cards, to, where }, returns }: ActionMoveCards,
  variables: VariableMap,
  game: Game
) {
  let destinations = isValidVariableName(to)
    ? variables.get(to)
    : filterCardHolders(to, variables, game);
  let destination: Deck | Hand | undefined = undefined;
  if (!destinations)
    throw new Error("No 'to' destinations found when moving cards");
  if (destinations instanceof Array) {
    const tempDestination = destinations.shift();
    if (!tempDestination)
      throw new Error("No 'to' destinations found when moving cards");
    destinations = tempDestination;
  }
  if (destinations instanceof Hand) destination = destinations;
  else if (destinations instanceof Deck) destination = destinations;

  if (!destination)
    throw new Error("Invalid to type, couldn't find a destination");

  const cardsFound: VariableTypes | undefined = isValidVariableName(cards)
    ? variables.get(cards)
    : performFilter(cards, variables, game);
  let cardsToMove;
  if (!cardsFound) throw new Error("No cards found");
  else if (!(cardsFound instanceof Array)) cardsToMove = [cardsFound];
  else {
    cardsToMove = cardsFound;
  }
  for (let card of cardsToMove) {
    if (!(card instanceof Card))
      throw new Error("Tried to move something that isn't a card");
    const source = getCardSource(card, game);
    if (!source) throw new Error("Card does not have a source");

    source.removeCard(card);
    destination.addCard(card, where);
    performEvent(
      {
        type: "event:card.moved",
        data: { destination: destination, moved_card: card, source: source },
      },
      game
    );
  }
  // Returns

  if (!returns) return;
  const destVar = returns.destination;
  const movedVar = returns.moved_cards;
  cardsToMove = cardsToMove as Card[];

  if (isValidVariableName(destVar)) variables.set(destVar, destination);
  if (isValidVariableName(movedVar)) variables.set(movedVar, cardsToMove);
}

export function performCardAction(
  action: CardAction,
  variables: VariableMap,
  game: Game
) {
  switch (action.type) {
    case "action:cards.move":
      return performMoveCardsAction(action, variables, game);
  }
}

export function actionIsCardAction(action: Action): action is CardAction {
  return action.type.startsWith("action:cards.");
}
export type CardAction = ActionMoveCards;
