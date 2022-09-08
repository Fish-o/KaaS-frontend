// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: "1466528",
  key: "9b15d4512b24e69e67f5",
  secret: "deadd00c5078dcd9d9b5",
  cluster: "us2",
  // useTLS: true,
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const data = req.body;
  const socketId = data.socket_id;
  const channel = data.channel_name;
  const authResponse = pusher.authorizeChannel(socketId, channel);
  res.status(200).send(authResponse);
}
