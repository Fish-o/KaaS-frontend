import { Channel } from "pusher-js";
import { disconnectResponse } from "..";
import { log } from "../../graphics/ui";

export async function leave_lobby(
  user_id: string,
  lobby: Channel,
  lobby_key: string
) {
  log("game/conn", "Leaving lobby...", lobby.name);
  // Trigger the leave event and wait for it to go through
  lobby.trigger("client-disconnect", {
    type: "disconnect_request",
    sender_id: user_id,
    lobby_key,
  });
  // wait 10 seconds
  // await new Promise((resolve) => setTimeout(resolve, 10000));
  await new Promise<void>((resolve) => {
    lobby.bind("client-disconnect", (data: disconnectResponse) => {
      if (data.type === "disconnect_response" && data.responds_to === user_id) {
        console.log("Disconnected from lobby");
        resolve();
      }
    });
  });
}
