import {
  Action,
  performActions,
  PlayerResolvable,
  Resolvable,
  Variable,
  VariableMap,
  VariableTypes,
} from ".";
import { BaseAction } from "./BaseAction";
import {
  awaitEvent,
  broadcastGameEvent,
  SelectPlayerEvent,
} from "../../networking/events";
import { performFilter } from "../Filters";
import { Game, isValidVariableName } from "../Game";
import { Player } from "../Objects/Player";

class BaseUserInputAction extends BaseAction {
  type: `action:user_input.${string}`;
}

class ActionUserInputSelectPlayers extends BaseUserInputAction {
  type: "action:user_input.select_players";
  args: {
    selector: PlayerResolvable;
    max: number;
    min: number;
    message: string;
    from?: PlayerResolvable;
  };
  returns?: {
    selected?: Variable;
    // options?: Variable;
  };
}
export type UserInputAction = ActionUserInputSelectPlayers;

async function performActionUserInputSelectPlayers(
  action: ActionUserInputSelectPlayers,
  variables: VariableMap,
  game: Game
): Promise<void> {
  const { from, max, min, message, selector } = action.args;
  const players: any[] | any = from
    ? typeof from === "string"
      ? variables.get(from)
      : performFilter(from, variables, game)
    : [...game.getAllPlayers()];
  if (typeof players !== "object") throw new Error("Invalid players");
  else if (Array.isArray(players)) {
    if (players.length < min) throw new Error("Not enough players");
    if (players.some((p) => !(p instanceof Player)))
      throw new Error("Non player object(s) in player selector");
  } else {
    if (!(players instanceof Player))
      throw new Error("Non player object in player selector");
  }

  let playerSelecting =
    typeof selector === "string"
      ? variables.get(selector)
      : performFilter(selector, variables, game);
  if (typeof playerSelecting !== "object")
    throw new Error("Invalid player selecting, not an object");
  else if (Array.isArray(playerSelecting)) {
    if (playerSelecting.length !== 1)
      throw new Error("Invalid player selecting, multiple players matched");
    playerSelecting = playerSelecting[0];
  }
  if (!(playerSelecting instanceof Player))
    throw new Error("Invalid player selecting, not a player");

  let results: Player[] = [];
  if (playerSelecting.user_id === game.user_id) {
    const player = await game.graphics.promptPlayerSelection(
      Array.isArray(players) ? players : [players]
    );
    await broadcastGameEvent(game, {
      event: "select:player",
      selected_by: playerSelecting.user_id,
      results: [player.user_id],
    });
    results = [player];
  } else {
    const event = (await awaitEvent(
      game,
      "select:player"
    )) as SelectPlayerEvent;
    results = event.results.map(
      (result) => game.getAllPlayers().find((p) => p.user_id === result)!
    );
  }
  console.log("GOT THE FUCKING PLAYER MAN", results[0]);

  if (action.returns) {
    const { selected } = action.returns;
    if (isValidVariableName(selected)) variables.set(selected, results);
    // if (options) variables.set(options, players);
  }
}

export async function performUserInputAction(
  action: UserInputAction,
  variables: VariableMap,
  game: Game
) {
  switch (action.type) {
    case "action:user_input.select_players":
      return await performActionUserInputSelectPlayers(action, variables, game);
  }
}

export function actionIsUserInputAction(
  action: Action
): action is UserInputAction {
  return action.type.startsWith("action:user_input.");
}
