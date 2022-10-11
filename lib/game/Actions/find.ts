import { Filters, Variable, VariableMap } from ".";
import { BaseAction } from "./BaseAction";
import {
  CardFilterObject,
  DeckFilterObject,
  performFilter,
  filterIsCardFilter,
  filterIsDeckFilter,
  filterIsHandFilter,
  filterIsPlayerFilter,
  HandFilterObject,
  PlayerFilterObject,
} from "../Filters";
import { Game, isValidVariableName } from "../Game";
import { DebugContext, debugLog } from "..";

class BaseActionFind<T extends Filters, N extends string> extends BaseAction {
  type: `action:find.${N}`;
  args: {
    filter: T;
  };
  returns?: Partial<{
    found_many: Variable;
    found_one: Variable;
  }>;
}

type ActionFindPlayers = BaseActionFind<PlayerFilterObject, "players">;
type ActionFindCards = BaseActionFind<CardFilterObject, "cards">;
type ActionFindDecks = BaseActionFind<DeckFilterObject, "decks">;
type ActionFindHands = BaseActionFind<HandFilterObject, "hands">;

export type FindAction =
  | ActionFindPlayers
  | ActionFindCards
  | ActionFindDecks
  | ActionFindHands;

export async function performFindAction(
  action: FindAction,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
) {
  if (!action.args.filter)
    throw new Error("Required argument 'filter' not provided");
  const enteredFilter = action.args.filter;
  let result;
  if (filterIsPlayerFilter(enteredFilter))
    result = await performFilter(enteredFilter, variables, game, debugContext);
  else if (filterIsDeckFilter(enteredFilter))
    result = await performFilter(enteredFilter, variables, game, debugContext);
  else if (filterIsCardFilter(enteredFilter))
    result = await performFilter(enteredFilter, variables, game, debugContext);
  else if (filterIsHandFilter(enteredFilter))
    result = await performFilter(enteredFilter, variables, game, debugContext);
  else throw new Error(`Invalid filter type ${action.args?.filter?.type}`);

  if (!action.returns) return;
  else if (action.returns) {
    debugLog("Returns", debugContext, action.returns, [...result]);
    const { found_many, found_one } = action.returns;
    if (isValidVariableName(found_many)) variables.set(found_many, result);
    if (isValidVariableName(found_one)) {
      const one = result.shift();
      variables.set(found_one, one || null);
    }
  }
}

export function actionIsFindAction(action: BaseAction): action is FindAction {
  return action.type.startsWith("action:find.");
}
