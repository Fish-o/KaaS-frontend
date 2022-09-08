import { Action, performActions, Resolvable, Variable, VariableMap } from ".";
import { BaseAction } from "./BaseAction";
import { Condition, performCondition } from "../Conditions";
import { Game } from "../Game";

class BaseLogicAction extends BaseAction {
  type: `action:logic.${string}`;
}
/*
  Logic If
*/

class ActionLogicIf extends BaseLogicAction {
  type: "action:logic.if";
  args: {
    condition: Condition;
    true_actions: Action[];
    false_actions: Action[];
  };
}

async function performActionLogicIf(
  action: ActionLogicIf,
  variables: VariableMap,
  game: Game
): Promise<void> {
  const { condition, true_actions, false_actions } = action.args;
  const result = performCondition(condition, variables);
  if (result) {
    return performActions(true_actions, variables, game);
  } else {
    return performActions(false_actions, variables, game);
  }
}

/*
  Logic For Each
*/

class ActionLogicForEach extends BaseLogicAction {
  type: "action:logic.for_each";
  args: {
    collection: Resolvable;
    as: Variable;
    actions: Action[];
  };
}
async function performActionLogicForEach(
  action: ActionLogicForEach,
  variables: VariableMap,
  game: Game
): Promise<void> {
  const { collection, as, actions } = action.args;
  if (!as.startsWith("$")) throw new Error("Variable name must start with $");

  let iterable;
  if (typeof collection === "string") {
    const variable = variables.get(collection);
    if (variable === undefined)
      throw new Error(`Variable ${collection} not found`);
    iterable = variable;
  } else {
    iterable = collection;
  }
  if (!(iterable instanceof Array))
    throw new Error(`Collection is not an array`);
  for (const item of iterable) {
    variables.set(as, item);
    await performActions(actions, variables, game);
  }
  variables.delete(as);
}

/*
  Other
*/

export type LogicAction = ActionLogicIf | ActionLogicForEach;
export function performLogicAction(
  action: LogicAction,
  variables: VariableMap,
  game: Game
): Promise<void> {
  switch (action.type) {
    case "action:logic.if":
      return performActionLogicIf(action, variables, game);
    case "action:logic.for_each":
      return performActionLogicForEach(action, variables, game);
  }
}

export function actionIsLogicAction(action: Action): action is LogicAction {
  return action.type.startsWith("action:logic.");
}
