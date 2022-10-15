import { Action, performActions, Variable, VariableMap } from ".";
import { Resolvable, resolveBaseObject } from "./resolvables";
import { BaseAction } from "./BaseAction";
import { Condition, performCondition } from "../Conditions";
import { Game } from "../Game";
import { DebugContext } from "..";

class BaseLogicAction extends BaseAction {
  type: `action:logic.${string}`;
  returns: {};
}
/*
  Logic If
*/

export class ActionLogicIf implements BaseLogicAction {
  type: "action:logic.if";
  args: {
    condition: Condition;
    true_actions: Action[];
    false_actions: Action[];
  };
  returns: {};
}

async function performActionLogicIf(
  action: ActionLogicIf,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<void | null | boolean> {
  const { condition, true_actions, false_actions } = action.args;
  const result = await performCondition(
    condition,
    variables,
    game,
    debugContext
  );
  if (result) {
    return performActions(true_actions, variables, game, debugContext);
  } else {
    return performActions(false_actions, variables, game, debugContext);
  }
}

class ActionLogicLoop implements BaseLogicAction {
  type: "action:logic.loop";
  args: {
    actions: Action[];
    loops: number;
  };
  returns: {};
}

async function performActionLogicLoop(
  action: ActionLogicLoop,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<void | null | boolean> {
  let { loops, actions } = action.args;

  if (typeof loops === "string") {
    loops = parseInt(loops);
  }

  for (let i = 0; i < loops; i++) {
    const result = await performActions(actions, variables, game, debugContext);
    if (result) return result;
  }
}

/*
  Logic For Each
*/

class ActionLogicForEach implements BaseLogicAction {
  type: "action:logic.for_each";
  args: {
    collection: Resolvable;
    as: Variable;
    actions: Action[];
  };
  returns: {};
}
async function performActionLogicForEach(
  action: ActionLogicForEach,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<void | null | boolean> {
  const { collection, as, actions } = action.args;
  if (!as.startsWith("$")) throw new Error("Variable name must start with $");

  let iterable = await resolveBaseObject(
    collection,
    variables,
    game,
    debugContext
  );
  if (!(iterable instanceof Array))
    throw new Error(`Collection is not an array`);
  console.log("iterable", iterable);
  for (const item of iterable) {
    console.log(variables);
    variables.set(as, item);
    console.log(variables);
    let value = await performActions(actions, variables, game, debugContext);
    if (value !== undefined) return value;
  }
  variables.delete(as);
}

/*
  Other
*/

export class ActionLogicReturn implements BaseLogicAction {
  type: "action:logic.return";
  args: {
    value: boolean;
  };
  returns: {};
}

export class ActionLogicBreak implements BaseLogicAction {
  type: "action:logic.break";
  args: {};
  returns: {};
}

export class ActionLogicMethod implements BaseLogicAction {
  type: "action:logic.method";
  args: {
    methodName: string;
  };
  returns: {};
}

export async function preformMethodAction(
  action: ActionLogicMethod,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<void | null | boolean> {
  const { methodName } = action.args;
  const method = game.getMethodFromName(
    ("method:" + methodName) as `method:${string}`
  );
  if (!method) {
    throw new Error(`Method "${methodName}" Does not exist`);
  }

  let value = await performActions(
    method.actions,
    variables,
    game,
    debugContext
  );
}

export type LogicAction =
  | ActionLogicIf
  | ActionLogicLoop
  | ActionLogicForEach
  | ActionLogicReturn
  | ActionLogicBreak
  | ActionLogicMethod;
export function performLogicAction(
  action: LogicAction,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<void | null | boolean> {
  switch (action.type) {
    case "action:logic.if":
      return performActionLogicIf(action, variables, game, debugContext);
    case "action:logic.loop":
      return performActionLogicLoop(action, variables, game, debugContext);
    case "action:logic.for_each":
      return performActionLogicForEach(action, variables, game, debugContext);
    case "action:logic.return":
      return action.args.value ? Promise.resolve(true) : Promise.resolve(false);
    case "action:logic.break":
      return Promise.resolve(null);
    case "action:logic.method":
      return preformMethodAction(action, variables, game, debugContext);
  }
}

export function actionIsLogicAction(action: Action): action is LogicAction {
  return action.type.startsWith("action:logic.");
}
