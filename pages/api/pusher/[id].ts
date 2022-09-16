import { NextApiRequest, NextApiResponse } from "next";
import Pusher from "pusher";

// const pusher = new Pusher({
//   appId: process.env.PUSHER_APPID!,
//   key: process.env.PUSHER_KEY!,
//   secret: process.env.PUSHER_SECRET!,
//   cluster: process.env.PUSHER_CLUSTER!,
// });

const pusher = new Pusher({
  appId: "1466528",
  key: "9b15d4512b24e69e67f5",
  secret: "deadd00c5078dcd9d9b5",
  cluster: "us2",
  useTLS: false,

  // useTLS: true,
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
