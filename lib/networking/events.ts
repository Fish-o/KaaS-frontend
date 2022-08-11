import _ from "lodash";
import { nanoid } from "nanoid";
import { Channel } from "pusher-js";
import { decryptSymmetric, encryptSymmetric } from "../crypto";
import { EventObject } from "../game/Events";

import { Game } from "../game/Game";
import { PlayerObject } from "../game/Resolvers";
import { log } from "../graphics";
import { hostConnectHandler } from "./host/connect";

interface BaseEvent {
  event: string;
  sender_id: string;
  timestamp: number;
  proof: string;
  proof_iv: string;
}

interface PlayerJoinEvent extends BaseEvent {
  event: "player_join";
  player: PlayerObject;
}
interface PlayerLeaveEvent extends BaseEvent {
  event: "player_leave";
  user_id: string;
}
interface PlayerNameChangeEvent extends BaseEvent {
  event: "player_name_change";
  user_id: string;
  new_name: string;
}

interface PlayerNameChangeEvent extends BaseEvent {
  event: "player_name_change";
  user_id: string;
  new_name: string;
}
interface GameStartEvent extends BaseEvent {
  event: "game_start";
}

// export interface GameEventEvent extends BaseEvent {
//   event: "game_event";
//   data: SendableEvent<any>;
// }

type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;

type GameEvent =
  | PlayerJoinEvent
  | PlayerLeaveEvent
  | PlayerNameChangeEvent
  | GameStartEvent;
// | GameEventEvent;

export type PartialGameEvent = DistributiveOmit<
  GameEvent,
  "sender_id" | "timestamp" | "proof" | "proof_iv"
>;

export async function handleEvent(game: Game, event: GameEvent) {
  switch (event.event) {
    case "player_join":
      if (
        game
          .getAllPlayers()
          .some((p) => p.user_id === event.player.object.user_id)
      )
        return;
      game.addPlayer(event.player);
      break;
    case "player_leave":
      {
        const player = game
          .getAllPlayers()
          .find((p) => p.user_id === event.user_id);
        if (!player) throw new Error("player_leave, player not found");
        game.removePlayer(player);
      }
      break;
    case "player_name_change":
      {
        const player = game
          .getAllPlayers()
          .find((p) => p.user_id === event.user_id);
        if (!player) throw new Error("player_name_change, player not found");
        player.name = event.new_name;
      }
      break;
    case "game_start":
      {
        game.start();
      }
      break;
  }
}
export async function verifyGameEvent(game: Game, event: GameEvent) {
  try {
    const { proof, proof_iv, timestamp } = event;
    const key = game.lobby_key;
    const proofText = await decryptSymmetric({
      text: proof,
      key,
      iv: proof_iv,
    });
    if (proofText !== timestamp.toString()) {
      console.error("game/events", "Proof mismatch", event, proofText);
      return false;
    }

    return true;
  } catch (err) {
    console.error("game/events", "Proofing error", event, err);
    return false;
  }
}
export async function broadcastGameEvent(game: Game, event: PartialGameEvent) {
  const channel = game.lobbyChannel;
  const timestamp = Date.now();
  const [encrypted, iv] = await encryptSymmetric({
    text: timestamp.toString(),
    key: game.lobby_key,
  });

  const fullEvent: GameEvent = {
    ...event,
    sender_id: game.user_id,
    proof: encrypted,
    proof_iv: iv,
    timestamp: timestamp,
  };
  log("game/events", "->", "<game>", fullEvent);
  channel.trigger("client-game", fullEvent);
}
