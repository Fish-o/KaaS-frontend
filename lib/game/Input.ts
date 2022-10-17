import { DebugContext } from ".";
import {
  broadcastGameEvent,
  awaitEvent,
  SelectPlayerEvent,
  SelectCardEvent,
} from "../networking/events";
import { Variable, Action, VariableMap, performActions } from "./Actions";
import {
  PlayerResolvable,
  CardResolvable,
  resolvePlayerResolvable,
  resolveCardResolvable,
} from "./Actions/resolvables";
import { Game, isValidVariableName } from "./Game";
import { Card } from "./Objects/Card";
import { Player } from "./Objects/Player";

class BaseInput {
  type: `input:${string}`;
  input: {
    [key: string]: any;
  };
  returns: { [key: string]: Variable };
}

class InputUserSelectPlayers implements BaseInput {
  type: "input:select_players";
  input: {
    selector: PlayerResolvable;
    max: number;
    min: number;
    message: string;
    from?: PlayerResolvable;
    actions: Action[];
  };
  returns: {
    selected?: Variable;
  };
}

class InputUserSelectCards implements BaseInput {
  type: "input:select_cards";
  input: {
    selector: PlayerResolvable;
    max: number;
    min: number;
    message: string;
    from?: CardResolvable;
    actions: Action[];
  };
  returns: {
    selected?: Variable;
  };
}

export type UserInput = InputUserSelectPlayers | InputUserSelectCards;

/**
 * Prompts the user to select a player
 * @param action The action to perform
 * @param variables  The variables to use
 * @param game The global game state
 */
async function performActionUserInputSelectPlayers(
  input: InputUserSelectPlayers,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
) {
  const { from, max, min, message, selector, actions } = input.input;
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

  let cancelSelection = () => {};

  let promise = new Promise<Player[]>(async (resolve) => {
    let results: Player[];
    if (playerSelecting.user_id === game.user_id) {
      const { playerPromise, cancel } = game.ui.promptPlayerSelection(players);
      cancelSelection = cancel;

      let player = await playerPromise;
      await broadcastGameEvent(game, {
        event: "select:player",
        selected_by: playerSelecting.user_id,
        results: [player.user_id],
      });
      results = [player];
    } else {
      const { eventPromise, cancel } = awaitEvent(game, "select:player");
      cancelSelection = cancel;

      const event = await eventPromise;
      results = event.results.map(
        (result) => game.getAllPlayers().find((p) => p.user_id === result)!
      );
    }

    await performActions(actions, variables, game, debugContext);
    if (input.returns) {
      const { selected } = input.returns;
      if (isValidVariableName(selected)) variables.set(selected, results);
    }

    resolve(results);
  });

  return {
    promise,
    cancelSelection,
  };
}

async function preformActionUserInputSelectCards(
  input: InputUserSelectCards,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
) {
  const { from, max, min, message, selector, actions } = input.input;

  const cards = await resolveCardResolvable(
    from,
    variables,
    game,
    debugContext
  );
  const playerSelecting = (
    await resolvePlayerResolvable(selector, variables, game, debugContext, 1)
  )[0];

  let cancelSelection = () => {};

  let promise = new Promise(async (resolve) => {
    let results: Card[] = [];
    if (playerSelecting.user_id === game.user_id) {
      const { promise, cancel } = game.ui.promptCardSelection(cards, min, max);
      cancelSelection = cancel;

      const selectedCards = await promise;
      await broadcastGameEvent(game, {
        event: "select:card",
        selected_by: playerSelecting.user_id,
        results: selectedCards.map((c) => c.id),
      });
      results = selectedCards;
    } else {
      const { eventPromise, cancel } = awaitEvent(game, "select:card");
      cancelSelection = cancel;

      const event = await eventPromise;
      results = event.results.map(
        (result) => game.getAllCards().find((c) => c.id === result)!
      );
    }

    await performActions(actions, variables, game, debugContext);
    if (input.returns) {
      const { selected } = input.returns;
      if (isValidVariableName(selected)) variables.set(selected, results);
    }

    resolve(results);
  });

  return {
    promise,
    cancelSelection,
  };
}
export async function performUserInputAction(
  input: UserInput,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
) {
  switch (input.type) {
    case "input:select_players":
      return performActionUserInputSelectPlayers(
        input,
        variables,
        game,
        debugContext
      );
    case "input:select_cards":
      return preformActionUserInputSelectCards(
        input,
        variables,
        game,
        debugContext
      );
  }
}
