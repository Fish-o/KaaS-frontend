import { Channel } from "pusher-js";
import {
  ConnectRequest,
  connectResponse,
  HandshakeRequest,
  HandshakeResponse,
  SuccessfulConnectionResponse,
} from "..";
import {
  decrypt,
  decryptSymmetric,
  encrypt,
  exportKey,
  importKey,
  importSymmetricKey,
} from "../../crypto";
import { log } from "../../graphics/ui";

export async function join_lobby(
  user_id: string,
  public_key: CryptoKey,
  private_key: CryptoKey,
  lobby: Channel,
  password: string,
  player_name: string
) {
  try {
    log("game/conn", "Joining lobby with name:", lobby.name);
    log("game/conn", "Performing handshake...");
    const {
      encrypted_public_key,
      encrypted_symmetric_key,
      encrypted_symmetric_key_iv,
    } = await perform_handshake_with_host(user_id, public_key, lobby);
    log("game/conn", "Decrypting symmetric key...");
    const symmetric_key = await importSymmetricKey(
      await decrypt({
        text: encrypted_symmetric_key,
        privateKey: private_key,
      })
    );
    log("game/conn", "Decrypting host symmetric key IV...");
    const symmetric_key_iv = await decrypt({
      text: encrypted_symmetric_key_iv,
      privateKey: private_key,
    });
    log("game/conn", "Decrypting host public key...");
    const a = await decryptSymmetric({
      text: encrypted_public_key,
      key: symmetric_key,
      iv: symmetric_key_iv,
    });
    log("GOT KEY", a);
    const host_public_key = await importKey(a);

    log("game/conn", "Encrypting lobby password...");
    const encrypted_password = await encrypt({
      text: password,
      publicKey: host_public_key,
    });
    log("game/conn", "Getting lobby key...");
    const { encrypted_lobby_key, game: newGame } =
      await perform_connection_with_host(
        user_id,
        lobby,
        encrypted_password,
        player_name
      );
    log("game/conn", "Decrypting lobby key...");
    const lobby_key = await decrypt({
      text: encrypted_lobby_key,
      privateKey: private_key,
    });
    log("game/conn", `Got connection to lobby with key ${lobby_key}`);
    const imported_lobby_key = await importSymmetricKey(lobby_key);
    return { lobby_key: imported_lobby_key, gameObj: newGame };
  } catch (e) {
    console.error("game/conn", "Error joining lobby:", e);
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

    log("game/pusher", "->", "<handshake>", "Requesting handshake...");
    lobby.trigger("client-connect", {
      type: "handshake_request",
      sender_id: user_id,
      public_key: key,
    } as HandshakeRequest);
    let timed_out = true;
    lobby.bind("client-connect", (data: connectResponse) => {
      if (data.type !== "handshake_response") return;
      else if (data.responds_to !== user_id) return;
      log("game/pusher", "<-", "<handshake>", "Got handshake response");
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
