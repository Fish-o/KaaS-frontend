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
    console.log("[GAME/pusher]", "<-", "<debug>", data);
  });

  lobby.bind("client-alive", (data: AliveRequest | AliveResponse) => {
    console.log("[GAME/pusher]", "<-", "<alive>", data);

    if (data.type === "request" && data.sender_id !== game.user_id) {
      console.log("[GAME/pusher]", "<-", "<alive>", "Is this lobby alive?");
      const res: AliveResponse = {
        type: "response",
        nonce: data.nonce,
        from: game.is_host ? "host" : "client",
        game_state: game.game_state,
        sender_id: game.user_id,
      };
      lobby.trigger("client-alive", res);
      console.log("[GAME/pusher]", "->", "<alive>", `Yes! From: ${res.from}`);
    } else if (data.type === "response" && data.sender_id !== game.user_id) {
      console.log("[GAME/pusher]", "<-", "<alive>", `Yes! From: ${data.from}`);
    }
  });

  if (game.is_host) {
  }
}
export function checkAlive(
  user_id: string,
  lobby: Channel
): Promise<GameState | null> {
  return new Promise((resolve) => {
    console.log("[GAME/pusher]", "->", "<alive>", "Is this lobby alive?");
    const nonce = nanoid();

    let game_state: GameState | null = null;
    let host_alive = false;
    lobby.bind("client-alive", (data: AliveResponse) => {
      console.log("[GAME/pusher]", "<-", "<alive>", `Yes! From: ${data.from}`);
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
        console.log("[GAME/pusher]", "<-", "<alive>", "No");
        resolve(null);
      }
    }, 3000);
  });
}

export async function join_lobby(
  user_id: string,
  public_key: CryptoKey,
  private_key: CryptoKey,
  lobby: Channel,
  password: string,
  player_name: string
) {
  try {
    console.log("[GAME/conn]", "Joining lobby with name:", lobby.name);
    console.log("[GAME/conn]", "Performing handshake...");
    const {
      encrypted_public_key,
      encrypted_symmetric_key,
      encrypted_symmetric_key_iv,
    } = await perform_handshake_with_host(user_id, public_key, lobby);
    console.log("[GAME/conn]", "Decrypting symmetric key...");
    const symmetric_key = await importSymmetricKey(
      await decrypt({
        text: encrypted_symmetric_key,
        privateKey: private_key,
      })
    );
    console.log("[GAME/conn]", "Decrypting host symmetric key IV...");
    const symmetric_key_iv = await decrypt({
      text: encrypted_symmetric_key_iv,
      privateKey: private_key,
    });
    console.log("[GAME/conn]", "Decrypting host public key...");
    const a = await decryptSymmetric({
      text: encrypted_public_key,
      key: symmetric_key,
      iv: symmetric_key_iv,
    });
    console.log("GOT KEY", a);
    const host_public_key = await importKey(a);

    console.log("[GAME/conn]", "Encrypting lobby password...");
    const encrypted_password = await encrypt({
      text: password,
      publicKey: host_public_key,
    });
    console.log("[GAME/conn]", "Getting lobby key...");
    const { encrypted_lobby_key, game: newGame } =
      await perform_connection_with_host(
        user_id,
        lobby,
        encrypted_password,
        player_name
      );
    console.log("[GAME/conn]", "Decrypting lobby key...");
    const lobby_key = await decrypt({
      text: encrypted_lobby_key,
      privateKey: private_key,
    });
    console.log("[GAME/conn]", `Got connection to lobby with key ${lobby_key}`);
    return { lobby_key, gameObj: newGame };
  } catch (e) {
    console.error("[GAME/conn]", "Error joining lobby:", e);
    throw e;
  }
}

function perform_handshake_with_host(
  user_id: string,
  public_key: CryptoKey,
  lobby: Channel
): Promise<HandshakeResponse> {
  return new Promise(async (resolve, reject) => {
    const key = await exportKey(public_key);

    console.log(
      "[GAME/pusher]",
      "->",
      "<handshake>",
      "Requesting handshake..."
    );
    lobby.trigger("client-connect", {
      type: "handshake_request",
      sender_id: user_id,
      public_key: key,
    } as HandshakeRequest);
    let timed_out = true;
    lobby.bind("client-connect", (data: connectResponse) => {
      if (data.type !== "handshake_response") return;
      else if (data.responds_to !== user_id) return;
      console.log(
        "[GAME/pusher]",
        "<-",
        "<handshake>",
        "Got handshake response"
      );
      resolve(data);
      timed_out = false;
    });

    setTimeout(() => {
      if (timed_out) reject("Timed out");
    }, 3000);
  });
}

function perform_connection_with_host(
  user_id: string,
  lobby: Channel,
  encrypted_password: string,
  player_name: string
): Promise<SuccessfulConnectionResponse> {
  return new Promise((resolve, reject) => {
    lobby.trigger("client-connect", {
      type: "connect_request",
      sender_id: user_id,
      encrypted_lobby_password: encrypted_password,
      player_name: player_name,
    } as ConnectRequest);

    let timed_out = true;
    lobby.bind("client-connect", (data: connectResponse) => {
      if (data.type !== "connect_response") return;
      else if (data.responds_to !== user_id) return;
      if (data.success) resolve(data);
      else reject(data.reason);
      timed_out = false;
    });

    setTimeout(() => {
      if (timed_out) reject("Timed out");
    }, 3000);
  });
}

export type LobbyInfo = {
  name: string;
  password: string;
  key: string;
  user_id: string;
  lobby: Channel;
  pusher: Pusher;
};
