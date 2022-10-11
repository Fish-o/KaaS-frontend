import { Action, VariableMap } from ".";
import { DebugContext } from "..";
import { Game } from "../Game";
import { BaseAction } from "./BaseAction";
import { PlayerResolvable, resolvePlayerResolvable } from "./resolvables";
// import { resolvePlayer } from "../Resolvers";

interface BaseGameAction extends BaseAction {
  type: `action:game.${string}`;
}

interface WinGameAction extends BaseGameAction {
  type: "action:game.win";
  args: {
    winners: PlayerResolvable;
    losers?: PlayerResolvable;
  };
}

async function performWinGameAction(
  action: WinGameAction,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
) {
  const { winners, losers } = action.args;
  const winners_ = await resolvePlayerResolvable(
    winners,
    variables,
    game,
    debugContext
  );
  const losers_ = await resolvePlayerResolvable(
    losers,
    variables,
    game,
    debugContext
  );
  game.end(winners_[0], losers_);
}

export async function performGameAction(
  action: GameAction,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
) {
  switch (action.type) {
    case "action:game.win":
      return performWinGameAction(action, variables, game, debugContext);
  }
}

export function actionIsGameAction(action: Action): action is GameAction {
  return action.type.startsWith("action:game.");
}
export type GameAction = WinGameAction;
