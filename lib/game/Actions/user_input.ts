import { VariableMap } from ".";
import { DebugContext } from "..";
import { Game } from "../Game";
import { performUserInputAction, UserInput } from "../Input";
import { BaseAction } from "./BaseAction";

export class UserInputAction implements BaseAction {
  type: `action:user_input`;
  args: {
    inputs: UserInput[];
    operation: "all" | "any";
  };
  returns: {};
}

export async function preformUserInputAction(
  action: UserInputAction,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<void> {
  if (action.args.operation === "all") {
    await Promise.all(
      action.args.inputs.map(async (input) => {
        const { promise } = await performUserInputAction(
          input,
          variables,
          game,
          debugContext
        );
        await promise;
      })
    );
  } else if (action.args.operation === "any") {
    // Since each UserInputAction is async and returns a promise for the input result,
    // we await each of them once to get the selection promise and cancel function.
    const unAwaitedPromises = action.args.inputs.map(async (input) => {
      return performUserInputAction(input, variables, game, debugContext);
    });
    const promisedResults = await Promise.all(unAwaitedPromises);

    // We then await the first selection promise to get the result.
    await Promise.race(promisedResults.map((result) => result.promise));

    // Cancel all the other inputs
    promisedResults.forEach((result) => result.cancelSelection());
  }
}
