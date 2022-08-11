import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useRef } from "react";
import { Graphics } from "../lib/graphics";

const Game: NextPage = () => {
  const graphics = useRef<Graphics>();
  useEffect(() => {
    if (typeof window !== "undefined") {
      const createdGraphics = new Graphics();
      graphics.current = createdGraphics;
      createdGraphics.init().then(() => {
        if (createdGraphics?.game) createdGraphics?.start();
      });
      return () => {
        createdGraphics?.stop();
      };
    }
  }, []);
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
