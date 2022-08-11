import { VariableTypes } from "../game/Actions";
import { EventObject, performEvent } from "../game/Events";
import { Game } from "../game/Game";
import {
  CardObject,
  DeckObject,
  HandObject,
  PlayerObject,
} from "../game/Resolvers";
import { broadcastGameEvent, GameEventEvent } from "./events";

function broadcastGameEventEvent<T extends EventObject>(
  eventData: {
    type: T["type"];
    data: {
      [key in keyof T["returns"]]-?: VariableTypes;
    };
  },
  game: Game
) {
  const sendableEventData = {} as any;
  for (const key in eventData.data) {
    const value = eventData.data[key];
    if (!value) sendableEventData[key] = null;
    else if (Array.isArray(value))
      sendableEventData[key] = value.map((item) => item.getIdentifier());
    else sendableEventData[key] = value.getIdentifier();
  }

  const sendableEvent: SendableEvent<T> = {
    type: eventData.type,
    data: sendableEventData as SendableEvent<T>["data"],
  };
  return broadcastGameEvent(game, {
    event: "game_event",
    data: sendableEvent,
  });
}

export function handleGameEventEvent(game: Game, event: GameEventEvent) {
  const eventData = {} as any;
  console.debug(`Received game event:`, event);
  for (const key in event.data.data) {
    const typedKey = key as keyof GameEventEvent["data"];
    const identifier = event.data.data[typedKey];

    if (!identifier) eventData[key] = null;
    else if (Array.isArray(identifier))
      eventData[key] = identifier.map((item) => game.getVariable(item));
    else eventData[key] = game.getVariable(identifier);
  }

  performEvent(
    {
      type: event.data.type,
      data: eventData,
    },
    game
  );
}

export type GameIdentifier =
  | `deck:${string}`
  | `hand:${string}`
  | `player:${string}`
  | `card:${string}`;

export interface SendableEvent<T extends EventObject> {
  type: T["type"];
  data: {
    [key in keyof T["returns"]]-?: GameIdentifier[] | GameIdentifier | null;
  };
}
