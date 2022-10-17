import { DebugContext } from ".";
import { Action, performActions, VariableMap } from "./Actions";
import { Game } from "./Game";

export interface MethodObject {
  type: `method:${string}`;

  actions: Action[];
}

export async function performMethod<T extends MethodObject>(
  methodName: `method:${string}`,
  game: Game,
  variables: VariableMap,
  debugContext: DebugContext
  // broadcast: boolean = false
) {
  const method = game.getMethodFromName(methodName);
  if (!method) return;
  // for (let event of events) {
  // const variables: VariableMap = new Map();
  // if (event.returns)
  //   for (let [type, name] of Object.entries(event.returns)) {
  //     const entered = eventData.data[type as keyof T["returns"]];
  //     if (!entered)
  //       throw new Error(`No event data with key ${type} provided`);
  //     else if (!isValidVariableName(name))
  //       throw new Error(`${name} is not a valid variable name`);
  //     variables.set(name, entered);
  //   }
  await performActions(method.actions, variables, game, debugContext);
  // }
}
