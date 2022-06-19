import { Condition } from "../Conditions";
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
import { actionIsLogicAction, LogicAction, performLogicAction } from "./logic";

type CardHolderResolvable = CardHolderFilterObject | Variable;

type CardResolvable = CardFilterObject | Variable;
type PlayerResolvable = PlayerFilterObject | Variable;
type DeckResolvable = DeckFilterObject | Variable;
type HandResolvable = HandFilterObject | Variable;
export type Resolvable =
  | PlayerResolvable
  | CardResolvable
  | DeckResolvable
  | HandResolvable;

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
  | Player[];
export type VariableMap = Map<Variable, VariableTypes>;

export interface BaseAction {
  type: `action:${string}`;
  args: { [key: string]: any };
  returns?: { [key: string]: Variable };
}

interface BaseActionFind<T extends Resolvable, N extends string>
  extends BaseAction {
  type: `action:find_${N}`;
  args: {
    filter: T;
  };
  returns?: Partial<{
    found_many: Variable;
    found_one: Variable;
  }>;
}

/*
  Card Actions
*/

interface ActionMoveCards extends BaseAction {
  type: "action:move_cards";
  args: {
    cards: CardResolvable;
    to: CardHolderResolvable;
  };
  returns?: Partial<{
    moved_cards: Variable;
    destination: Variable;
  }>;
}

type CardActions = ActionMoveCards;

/*
  Find Actions
*/

type ActionFindPlayers = BaseActionFind<PlayerResolvable, "players">;
type ActionFindCards = BaseActionFind<CardResolvable, "cards">;
type ActionFindDecks = BaseActionFind<DeckResolvable, "decks">;
type ActionFindHands = BaseActionFind<HandResolvable, "hands">;

type FindActions =
  | ActionFindPlayers
  | ActionFindCards
  | ActionFindDecks
  | ActionFindHands;

/*
  Logic Actions
*/
/*
  Game state
*/

interface ActionGameReverseDirection extends BaseAction {
  type: "action:game_reverse_direction";
  args: {};
  returns: undefined;
}

type GameStateActions = never;

export type Action = CardActions | FindActions | LogicAction | GameStateActions;

export function performAction(
  action: Action,
  variables: VariableMap,
  game: Game
): void {
  if (actionIsLogicAction(action))
    return performLogicAction(action, variables, game);
  else throw new Error(`Unknown action type: ${action.type}`);
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
