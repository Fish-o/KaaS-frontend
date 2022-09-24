import { Action, VariableMap } from ".";
import { performEvent } from "../Events";
import { performFilter } from "../Filters";
import { Game, isValidVariableName } from "../Game";
import { BaseGameObject } from "../Objects";
import { BaseAction } from "./BaseAction";
import { Resolvable } from "./resolvables";

class BaseDataAction extends BaseAction {
  type: `action:data.${string}`;
}

class ActionSetData extends BaseDataAction {
  type: "action:data.set";
  args: {
    object: Resolvable;
    key: string;
    value: string | number | boolean;
  };
}

class ActionGetData extends BaseDataAction {
  type: "action:data.get";
  args: {
    object: Resolvable;
    key: string;
  };
  returns: {
    value: `$${string}`;
  };
}
async function preformSetDataAction(
  { type, args: { object, key, value } }: ActionSetData,
  variables: VariableMap,
  game: Game
) {
  let resolvedObjects = isValidVariableName(object)
    ? variables.get(object)
    : await performFilter(object, variables, game);
  let resolvedObject: BaseGameObject | undefined = undefined;
  if (!resolvedObjects) throw new Error("No object found");

  if (resolvedObjects instanceof Array) {
    const tempDestination = resolvedObjects.shift();
    if (!tempDestination) throw new Error("No object found");
    resolvedObject = tempDestination;
  }
  if (resolvedObjects instanceof BaseGameObject) {
    resolvedObject = resolvedObjects;
  }
  if (!resolvedObject)
    throw new Error("Invalid to type, couldn't find a destination");

  resolvedObject.setData(key, value);
  // performEvent(
  //   {
  //     type: "event:data.set"
  //     data: {
  //       object: resolvedObject,
  //       key,
  //       value
  //     }
  //   }
  // )
}

async function preformGetDataAction(
  { type, args: { object, key }, returns }: ActionGetData,
  variables: VariableMap,
  game: Game
) {
  let resolvedObjects = isValidVariableName(object)
    ? variables.get(object)
    : await performFilter(object, variables, game);
  let resolvedObject: BaseGameObject | undefined = undefined;
  if (!resolvedObjects) throw new Error("No object found");

  if (resolvedObjects instanceof Array) {
    const tempDestination = resolvedObjects.shift();
    if (!tempDestination) throw new Error("No object found");
    resolvedObject = tempDestination;
  }
  if (resolvedObjects instanceof BaseGameObject) {
    resolvedObject = resolvedObjects;
  }
  if (!resolvedObject)
    throw new Error("Invalid to type, couldn't find a destination");
  if (returns) {
    const { value } = returns;
    if (isValidVariableName(value))
      variables.set(value, resolvedObject.getData(key));
    // if (options) variables.set(options, players);
  }
}

export type DataAction = ActionSetData | ActionGetData;

export function preformDataAction(
  action: DataAction,
  variables: VariableMap,
  game: Game
) {
  switch (action.type) {
    case "action:data.set":
      return preformSetDataAction(action, variables, game);
    case "action:data.get":
      return preformGetDataAction(action, variables, game);
  }
}
export function actionIsDataAction(action: BaseAction): action is DataAction {
  return action.type.startsWith("action:data.");
}
