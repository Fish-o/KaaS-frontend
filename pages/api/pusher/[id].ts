import { NextApiRequest, NextApiResponse } from "next";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APPID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  const data = req.body;
  const param = req.query.id;
  try {
    await pusher.trigger(`lobby-${param}`, "debug", data);
    res.status(200).send("sent event successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send(`${err}`);
  }
}
