import {
  CardFilterObject,
  CardHolderFilterObject,
  DeckFilterObject,
  HandFilterObject,
  PlayerFilterObject,
} from "../Filters";
import { Game } from "../Game";
import { Card } from "../Objects/Card";
import { Deck } from "../Objects/Deck";
import { Hand, Player } from "../Objects/Player";
import { actionIsCardAction, CardAction, performCardAction } from "./cards";
import { actionIsFindAction, FindAction, performFindAction } from "./find";
import { actionIsLogicAction, LogicAction, performLogicAction } from "./logic";

export type CardHolderResolvable = CardHolderFilterObject | Variable;

export type CardResolvable = CardFilterObject | Variable;
export type PlayerResolvable = PlayerFilterObject | Variable;
export type DeckResolvable = DeckFilterObject | Variable;
export type HandResolvable = HandFilterObject | Variable;
export type Resolvable =
  | PlayerResolvable
  | CardResolvable
  | DeckResolvable
  | HandResolvable;
export type Filters =
  | CardFilterObject
  | PlayerFilterObject
  | DeckFilterObject
  | HandFilterObject;

export type TODO = never;
export type Variable = `$${string}`;
export type VariableTypes =
  | Deck
  | Card
  | Hand
  | Player
  | Deck[]
  | Card[]
  | Hand[]
  | Player[]
  | null;
export type VariableMap = Map<Variable, VariableTypes>;

export interface BaseAction {
  type: `action:${string}`;
  args: { [key: string]: any };
  returns?: { [key: string]: Variable };
}

interface ActionGameReverseDirection extends BaseAction {
  type: "action:game_reverse_direction";
  args: {};
  returns: undefined;
}

type GameStateActions = never;

export type Action = CardAction | FindAction | LogicAction | GameStateActions;

export function performAction(
  action: Action,
  variables: VariableMap,
  game: Game
): void {
  if (actionIsLogicAction(action))
    return performLogicAction(action, variables, game);
  else if (actionIsFindAction(action))
    return performFindAction(action, variables, game);
  else if (actionIsCardAction(action))
    return performCardAction(action, variables, game);
  // @ts-expect-error
  else throw new Error(`Unknown action type: ${action?.type}`);
}

export function performActions(
  actions: Action[],
  variables: VariableMap,
  game: Game
) {
  for (const action of actions) {
    performAction(action, variables, game);
  }
}
