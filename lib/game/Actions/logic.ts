import { Action, performActions, Variable, VariableMap } from ".";
import { Resolvable, resolveBaseObject } from "./resolvables";
import { BaseAction } from "./BaseAction";
import { Condition, performCondition } from "../Conditions";
import { Game } from "../Game";

class BaseLogicAction extends BaseAction {
  type: `action:logic.${string}`;
}
/*
  Logic If
*/

export class ActionLogicIf extends BaseLogicAction {
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
): Promise<void | null | boolean> {
  const { condition, true_actions, false_actions } = action.args;
  const result = performCondition(condition, variables);
  if (result) {
    return performActions(true_actions, variables, game);
  } else {
    return performActions(false_actions, variables, game);
  }
}

class ActionLogicLoop extends BaseLogicAction {
  type: "action:logic.loop";
  args: {
    actions: Action[];
    loops: number;
  };
}

async function performActionLogicLoop(
  action: ActionLogicLoop,
  variables: VariableMap,
  game: Game
): Promise<void | null | boolean> {
  let { loops, actions } = action.args;

  if (typeof loops === "string") {
    loops = parseInt(loops);
  }

  for (let i = 0; i < loops; i++) {
    const result = await performActions(actions, variables, game);
    if (result) return result;
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
): Promise<void | null | boolean> {
  const { collection, as, actions } = action.args;
  if (!as.startsWith("$")) throw new Error("Variable name must start with $");

  let iterable = await resolveBaseObject(collection, variables, game);
  if (!(iterable instanceof Array))
    throw new Error(`Collection is not an array`);

  for (const item of iterable) {
    variables.set(as, item);
    let value = await performActions(actions, variables, game);
    if (value !== undefined) return value;
  }
  variables.delete(as);
}

/*
  Other
*/

export class ActionLogicReturn extends BaseLogicAction {
  type: "action:logic.return";
  args: {
    value: boolean;
  };
}

export class ActionLogicBreak extends BaseLogicAction {
  type: "action:logic.break";
}
export type LogicAction =
  | ActionLogicIf
  | ActionLogicLoop
  | ActionLogicForEach
  | ActionLogicReturn
  | ActionLogicBreak;
export function performLogicAction(
  action: LogicAction,
  variables: VariableMap,
  game: Game
): Promise<void | null | boolean> {
  switch (action.type) {
    case "action:logic.if":
      return performActionLogicIf(action, variables, game);
    case "action:logic.loop":
      return performActionLogicLoop(action, variables, game);
    case "action:logic.for_each":
      return performActionLogicForEach(action, variables, game);
    case "action:logic.return":
      return action.args.value ? Promise.resolve(true) : Promise.resolve(false);
    case "action:logic.break":
      return Promise.resolve(null);
  }
}

export function actionIsLogicAction(action: Action): action is LogicAction {
  return action.type.startsWith("action:logic.");
}
