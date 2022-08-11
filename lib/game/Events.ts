import {
  Action,
  performActions,
  Variable,
  VariableMap,
  VariableTypes,
} from "./Actions";
import { Game, isValidVariableName } from "./Game";

interface BaseEventObject {
  type: `event:${string}`;
  returns?: {
    [key: string]: Variable;
  };
}
interface CardMovedEventObject extends BaseEventObject {
  type: `event:card.moved`;
  returns: Partial<{
    moved_card: Variable;
    destination: Variable;
    source: Variable;
  }>;

  actions: Action[];
}
interface GameInitEventObject extends BaseEventObject {
  type: `event:game.init`;
  returns: Partial<{}>;
  actions: Action[];
}

interface GameStartEventObject extends BaseEventObject {
  type: `event:game.start`;
  returns: Partial<{}>;
  actions: Action[];
}

interface GameNewTurnEventObject extends BaseEventObject {
  type: `event:game.new_turn`;
  returns: Partial<{
    previous: Variable;
    current: Variable;
  }>;
  actions: Action[];
}

export type EventObject =
  | CardMovedEventObject
  | GameInitEventObject
  | GameStartEventObject
  | GameNewTurnEventObject;

export function performEvent<T extends EventObject>(
  eventData: {
    type: T["type"];
    data: {
      [key in keyof T["returns"]]-?: VariableTypes;
    };
  },
  game: Game
  // broadcast: boolean = false
) {
  // if (broadcast) {
  //   broadcastGameEventEvent(eventData, game);
  // }

  const events = game.getEventsFromType<T>(eventData.type);
  if (!events) return;
  for (let event of events) {
    const variables: VariableMap = new Map();
    if (event.returns)
      for (let [type, name] of Object.entries(event.returns)) {
        const entered = eventData.data[type as keyof T["returns"]];
        if (!entered)
          throw new Error(`No event data with key ${type} provided`);
        else if (!isValidVariableName(name))
          throw new Error(`${name} is not a valid variable name`);
        variables.set(name, entered);
      }
    performActions(event.actions, variables, game);
  }
}
