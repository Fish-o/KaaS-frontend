import _ from "lodash";
import { nanoid } from "nanoid";
import { Channel } from "pusher-js";
import {
  connectionRequest,
  FailedConnectionResponse,
  HandshakeResponse,
  SuccessfulConnectionResponse,
} from "..";
import {
  decrypt,
  encrypt,
  encryptSymmetric,
  exportKey,
  exportSymmetricKey,
  generateSymmetricKey,
  importKey,
} from "../../crypto";
import { Game, GameState } from "../../game/Game";
import { PlayerObject } from "../../game/Resolvers";
import { fireGameEvent } from "../events";

export async function hostConnectHandler(game: Game, lobby: Channel) {
  lobby.bind("client-connect", async (data: connectionRequest) => {
    console.log("[NETWORKING/connect]", "<-", "<client-connect>", data);
    const exported_host_key = await exportKey(game.public_key);

    if (data.sender_id === game.user_id) return;
    if (data.type === "handshake_request") {
      const client_public_key = await importKey(data.public_key);
      game.addToPhoneBook(data.sender_id, client_public_key);
      console.log("KEYYYY", await exportKey(client_public_key));
      const symmetric_key = await generateSymmetricKey();
      console.log("made symmetric");
      const [encrypted_host_public_key, iv] = await encryptSymmetric({
        text: exported_host_key,
        key: symmetric_key,
      });
      console.log("used symmetric");
      const exported_symmetric_key = await exportSymmetricKey(symmetric_key);
      console.log("exported symmetric");
      const encrypted_symmetric_key = await encrypt({
        text: exported_symmetric_key,
        publicKey: client_public_key,
      });
      console.log("encrypted symmetric");

      const encrypted_symmetric_key_iv = await encrypt({
        text: iv,
        publicKey: client_public_key,
      });

      console.log("encrypted iv");
      const response: HandshakeResponse = {
        type: "handshake_response",
        sender_id: game.user_id,
        responds_to: data.sender_id,
        encrypted_public_key: encrypted_host_public_key,
        encrypted_symmetric_key,
        encrypted_symmetric_key_iv,
      };
      console.log(
        "[NETWORKING/connect]",
        "->",
        "<handshake_response>",
        response
      );

      lobby.trigger("client-connect", response);
    } else if (data.type === "connect_request") {
      const { encrypted_lobby_password, sender_id, player_name } = data;

      if (game.game_state !== GameState.Setup)
        return lobby.trigger("client-connect", {
          type: "connect_response",
          sender_id: game.user_id,
          responds_to: sender_id,
          success: false,
          reason: "Game already started",
        } as FailedConnectionResponse);
      else if (game.getAllPlayers().length >= game.maxPlayerCount)
        return lobby.trigger("client-connect", {
          type: "connect_response",
          sender_id: game.user_id,
          responds_to: sender_id,
          success: false,
          reason: "Lobby full",
        } as FailedConnectionResponse);

      const client_public_key = game.getFromPhoneBook(sender_id);
      if (!client_public_key)
        return lobby.trigger("client-connect", {
          type: "connect_response",
          sender_id: game.user_id,
          responds_to: sender_id,
          success: false,
          reason: "Client not found in phone book",
        } as FailedConnectionResponse);

      const lobby_password = await decrypt({
        text: encrypted_lobby_password,
        privateKey: game.private_key,
      });
      if (lobby_password !== game.lobby_password)
        return lobby.trigger("client-connect", {
          type: "connect_response",
          sender_id: game.user_id,
          responds_to: sender_id,
          success: false,
          reason: "Lobby password incorrect",
        } as FailedConnectionResponse);

      const encrypted_lobby_key = await encrypt({
        text: await exportSymmetricKey(game.lobby_key),
        publicKey: client_public_key,
      });

      // TODO: Create a 'default player', that allows you to pre-fil the hands, set hand name to $player.name's hand, etc.
      const newPlayer: PlayerObject = {
        type: "object:player",
        object: {
          name: player_name,
          tags: [],
          user_id: sender_id,
          hand: {
            type: "object:hand",
            object: {
              name: "hand",
              cards: [
                {
                  type: "object:card",
                  object: {
                    name: player_name,
                    description: "a",
                    tags: [],
                  },
                },
              ],
              tags: [],
            },
          },
        },
      };
      game.addPlayer(newPlayer);

      fireGameEvent(game, {
        event: "player_join",
        player: newPlayer,
      });

      const response: SuccessfulConnectionResponse = {
        type: "connect_response",
        sender_id: game.user_id,
        responds_to: sender_id,
        success: true,
        game: game.makeGameObject(),
        encrypted_lobby_key: encrypted_lobby_key,
      };
      lobby.trigger("client-connect", response);
    }
  });
  console.log("[NETWORKING]", "client-connect bound");
}
