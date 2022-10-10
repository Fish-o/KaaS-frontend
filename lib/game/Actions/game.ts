// import { Action, BaseAction, PlayerResolvable, VariableMap } from ".";
import { Game } from "../Game";
// import { resolvePlayer } from "../Resolvers";

// interface BaseGameAction extends BaseAction {
//   type: `action:game.${string}`;
// }

// interface WinGameAction extends BaseGameAction {
//   type: "action:game.win";
//   args: {
//     winners: PlayerResolvable;
//     losers?: PlayerResolvable;
//   };
// }

// async function performWinGameAction(
//   action: WinGameAction,
//   variables: VariableMap,
//   game: Game
// ){
//   const { winners, losers } = action.args;
//   const winners_ = await filter(winners, variables, game, debugContext);
//   const losers_ = await resolvePlayers(losers, variables, game, debugContext);
//   game.win(winners_, losers_);
// }

// export async function performGameAction(
//   action: GameAction,
//   variables: VariableMap,
//   game: Game
// ) {
//   switch (action.type) {
//     case "action:game.win":
//       return performWinGameAction(action, variables, game, debugContext);
//   }
// }

// export function actionIsGameAction(action: Action): action is GameAction {
//   return action.type.startsWith("action:game.");
// }
// export type GameAction = WinGameAction;
