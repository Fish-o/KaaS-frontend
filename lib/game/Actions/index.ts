import {
  CardFilterObject,
  CardHolderFilterObject,
  DeckFilterObject,
  performFilter,
  Filter,
  HandFilterObject,
  PlayerFilterObject,
} from "../Filters";
import { Game } from "../Game";
import { BaseGameObject } from "../Objects";
import { Card } from "../Objects/Card";
import { Deck } from "../Objects/Deck";
import { Hand, Player } from "../Objects/Player";
import { BaseAction } from "./BaseAction";
import { actionIsCardAction, CardAction, performCardAction } from "./cards";
import { actionIsDataAction, DataAction, preformDataAction } from "./data";
import { actionIsDeckAction, DeckAction, preformDeckAction } from "./deck";
import { actionIsFindAction, FindAction, performFindAction } from "./find";
import { actionIsLogicAction, LogicAction, performLogicAction } from "./logic";
import { Resolvable } from "./resolvables";
import {
  actionIsUserInputAction,
  performUserInputAction,
  UserInputAction,
} from "./user_input";

export type TODO = never;

export type Variable = `$${string}`;
export type VariableTypes =
  | Deck
  | Card
  | Hand
  | Player
  | BaseGameObject
  | Deck[]
  | Card[]
  | Hand[]
  | Player[]
  | BaseGameObject[]
  | string
  | number
  | boolean
  | null;
export type VariableMap = Map<Variable, VariableTypes>;
export type Filters =
  | CardFilterObject
  | PlayerFilterObject
  | DeckFilterObject
  | HandFilterObject;

//  class ActionGameReverseDirection extends BaseAction {
//   type: "action:game_reverse_direction";
//   args: {};
//   returns: undefined;
// }

// type GameStateActions = never;
interface DebugAction extends BaseAction {
  type: "action:debug";
  args: {
    find: Resolvable;
  };
}

export type Action =
  | CardAction
  | DeckAction
  | FindAction
  | LogicAction
  | DataAction
  // | GameStateActions
  | DebugAction
  | UserInputAction;

export async function performAction(
  action: Action,
  variables: VariableMap,
  game: Game
): Promise<void | null | boolean> {
  console.log("performing action", action, variables);
  if (actionIsLogicAction(action))
    return await performLogicAction(action, variables, game);
  else if (actionIsFindAction(action))
    return await performFindAction(action, variables, game);
  else if (actionIsCardAction(action))
    return await performCardAction(action, variables, game);
  else if (actionIsUserInputAction(action))
    return await performUserInputAction(action, variables, game);
  else if (actionIsDeckAction(action))
    return await preformDeckAction(action, variables, game);
  else if (actionIsDataAction(action))
    return await preformDataAction(action, variables, game);
  else if (action.type === "action:debug") {
    const find = action.args.find;
    let res = undefined;
    // log("[DEBUG]", action);
    if (typeof find === "string") {
      res = variables.get(find);
      // log("[DEBUG]", "found variable", find, res);
    } else {
      res = await performFilter(find, variables, game);
      // log("[DEBUG]", "found", res);
    }
    // @ts-expect-error
  } else throw new Error(`Unknown action type: ${action?.type}`);
}

export async function performActions(
  actions: Action[],
  variables: VariableMap,
  game: Game
): Promise<void | null | boolean> {
  for (const action of actions) {
    let value = await performAction(action, variables, game);
    if (value !== undefined) return value;
  }
}
