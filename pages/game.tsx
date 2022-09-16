import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useRef } from "react";
import { Graphics } from "../lib/graphics";
import styles from "../styles/Game.module.scss";
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
      <canvas id="cardCanvas" width="100" height="100"></canvas>
      <div className={styles.mainScreen}>
        <canvas className={styles.fullscreenCanvas} id="canvas" width="800" height="600"></canvas>
        <canvas className={styles.fullscreenCanvas} id="uiCanvas" width="800" height="600"></canvas>
      </div>

      <h1>Checking some stuff! </h1>
      <p>
        If this page shows for more then ~5 seconds then something went wrong.
        Check the console logs to see what
      </p>
    </div>
  );
};

export default Game;
