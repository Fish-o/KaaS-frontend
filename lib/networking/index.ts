import Pusher, { Channel } from "pusher-js";
import { nanoid } from "nanoid";
import { Game, GameState } from "../game/Game";
import { GameObject } from "../game/Resolvers";
import {
  decrypt,
  decryptSymmetric,
  encrypt,
  exportKey,
  importKey,
  importSymmetricKey,
} from "../crypto";
import { hostConnectHandler } from "./host/connect";
import { handleEvent, verifyGameEvent } from "./events";
import { log } from "../graphics/ui";

export type AliveRequest = {
  type: "request";
  nonce: string;
  sender_id: string;
};
export type AliveResponse = {
  type: "response";
  nonce: string;
  from: "host" | "client";
  game_state: GameState;
  sender_id: string;
};

export type HandshakeRequest = {
  type: "handshake_request";
  sender_id: string;
  public_key: string;
};

export type HandshakeResponse = {
  type: "handshake_response";
  sender_id: string;
  responds_to: string;
  encrypted_symmetric_key: string;
  encrypted_symmetric_key_iv: string;
  encrypted_public_key: string;
};

export type ConnectRequest = {
  type: "connect_request";
  sender_id: string;
  player_name: string;
  encrypted_lobby_password: string; // This needs to encrypted using the host's public key
};

export type SuccessfulConnectionResponse = {
  type: "connect_response";
  sender_id: string;
  responds_to: string;
  success: true;
  encrypted_lobby_key: string;
  game: GameObject;
  seed: string;
};

export type FailedConnectionResponse = {
  type: "connect_response";
  sender_id: string;
  responds_to: string;
  success: false;
  reason: string;
};

export type connectResponse =
  | HandshakeResponse
  | FailedConnectionResponse
  | SuccessfulConnectionResponse;

export type connectionRequest = HandshakeRequest | ConnectRequest;

export function bindEvents(game: Game, lobby: Channel) {
  lobby.bind("client-debug", (data: any) => {
    log("game/pusher", "<-", "<debug>", data);
  });

  lobby.bind("client-alive", (data: AliveRequest | AliveResponse) => {
    log("game/pusher", "<-", "<alive>", data);

    if (data.type === "request" && data.sender_id !== game.user_id) {
      log("game/pusher", "<-", "<alive>", "Is this lobby alive?");
      const res: AliveResponse = {
        type: "response",
        nonce: data.nonce,
        from: game.is_host ? "host" : "client",
        game_state: game.game_state,
        sender_id: game.user_id,
      };
      lobby.trigger("client-alive", res);
      log("game/pusher", "->", "<alive>", `Yes! From: ${res}`);
    } else if (data.type === "response" && data.sender_id !== game.user_id) {
      log("game/pusher", "<-", "<alive>", `Yes! From: ${data}`);
    }
  });

  lobby.bind("client-game", async (data: any) => {
    if (typeof data !== "object") {
      log("game/pusher", "<-", "<game>", "Invalid data", data);
      return;
    }
    const isGameEvent = await verifyGameEvent(game, data);
    if (isGameEvent) handleEvent(game, data);
  });
}

export async function bindHostEvents(game: Game, lobby: Channel) {
  lobby.bind("client-game", (data: any) => {});
  hostConnectHandler(game, lobby);
}

export function checkAlive(
  user_id: string,
  lobby: Channel
): Promise<GameState | null> {
  return new Promise((resolve) => {
    log("game/pusher", "->", "<alive>", "Is this lobby alive?");
    const nonce = nanoid();

    let game_state: GameState | null = null;
    let host_alive = false;
    lobby.bind("client-alive", (data: AliveResponse) => {
      log("game/pusher", "<-", "<alive>", `Yes! From: ${JSON.stringify(data)}`);
      if (data.nonce === nonce) {
        game_state = data.game_state;
        if (data.from === "host") {
          if (!host_alive) resolve(game_state);
          host_alive = true;
        }
      }
    });
    lobby.trigger("client-alive", {
      type: "request",
      nonce: nonce,
      sender_id: user_id,
    } as AliveRequest);
    setTimeout(() => {
      if (host_alive) return;
      else if (game_state) return resolve(game_state);
      else {
        log("game/pusher", "<-", "<alive>", "No");
        resolve(null);
      }
    }, 5000);
  });
}

export type LobbyInfo = {
  name: string;
  password: string;
  key: CryptoKey;
  user_id: string;
  lobby: Channel;
  pusher: Pusher;
};
