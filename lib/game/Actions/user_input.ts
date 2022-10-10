import {
  Action,
  performActions,
  Variable,
  VariableMap,
  VariableTypes,
} from ".";
import { BaseAction } from "./BaseAction";
import {
  awaitEvent,
  broadcastGameEvent,
  SelectCardEvent,
  SelectPlayerEvent,
} from "../../networking/events";
import { performFilter } from "../Filters";
import { Game, isValidVariableName } from "../Game";
import { Player } from "../Objects/Player";
import {
  CardResolvable,
  PlayerResolvable,
  resolveCardResolvable,
  resolvePlayerResolvable,
} from "./resolvables";
import { Card } from "../Objects/Card";
import { DebugContext } from "..";

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

class ActionUserInputSelectCards extends BaseUserInputAction {
  type: "action:user_input.select_cards";
  args: {
    selector: PlayerResolvable;
    max: number;
    min: number;
    message: string;
    from?: CardResolvable;
  };
  returns: {
    selected: Variable;
    // options?: Variable;
  };
}

export type UserInputAction =
  | ActionUserInputSelectPlayers
  | ActionUserInputSelectCards;

/**
 * Prompts the user to select a player
 * @param action The action to perform
 * @param variables  The variables to use
 * @param game The global game state
 */
async function performActionUserInputSelectPlayers(
  action: ActionUserInputSelectPlayers,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<void> {
  const { from, max, min, message, selector } = action.args;

  const players = await resolvePlayerResolvable(
    from,
    variables,
    game,
    debugContext,
    1
  );
  const playerSelecting = (
    await resolvePlayerResolvable(selector, variables, game, debugContext, 1)
  )[0];

  let results: Player[] = [];
  if (playerSelecting.user_id === game.user_id) {
    const player = await game.ui.promptPlayerSelection(
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

async function preformActionUserInputSelectCards(
  action: ActionUserInputSelectCards,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
) {
  const { from, max, min, message, selector } = action.args;

  const cards = await resolveCardResolvable(
    from,
    variables,
    game,
    debugContext
  );
  const playerSelecting = (
    await resolvePlayerResolvable(selector, variables, game, debugContext, 1)
  )[0];

  let results: Card[] = [];
  if (playerSelecting.user_id === game.user_id) {
    const selectedCards = await game.ui.promptCardSelection(
      Array.isArray(cards) ? cards : [cards],
      min,
      max
    );

    await broadcastGameEvent(game, {
      event: "select:card",
      selected_by: playerSelecting.user_id,
      results: selectedCards.map((c) => c.id),
    });
    results = selectedCards;
  } else {
    const event = (await awaitEvent(game, "select:card")) as SelectCardEvent;
    results = event.results.map(
      (result) => game.getAllCards().find((c) => c.id === result)!
    );
  }
  console.log("GOT THE FUCKING CARD", results);

  if (action.returns) {
    const { selected } = action.returns;
    if (isValidVariableName(selected)) variables.set(selected, results);
    // if (options) variables.set(options, cards);
  }
}
export async function performUserInputAction(
  action: UserInputAction,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
) {
  switch (action.type) {
    case "action:user_input.select_players":
      return await performActionUserInputSelectPlayers(
        action,
        variables,
        game,
        debugContext
      );
    case "action:user_input.select_cards":
      return await preformActionUserInputSelectCards(
        action,
        variables,
        game,
        debugContext
      );
  }
}

export function actionIsUserInputAction(
  action: Action
): action is UserInputAction {
  return action.type.startsWith("action:user_input.");
}
