import type { NextPage } from "next";
import Head from "next/head";
import { game } from "../lib/interface";
import { useEffect } from "react";

const Game: NextPage = () => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // game?.connect("lobby-fish-391");
      return () => {
        game?.then((g) => g.disconnect());
      };
    }
  });
  return (
    <div style={{}}>
      <Head>
        <meta name="viewport" content="width=device-width" />
      </Head>
      <canvas id="canvas" width="800" height="600"></canvas>
      <h1>Checking some stuff! </h1>
      <p>
        If this page shows for more then ~5 seconds then something went wrong.
        Check the console logs to see what
      </p>
    </div>
  );
};

export default Game;
