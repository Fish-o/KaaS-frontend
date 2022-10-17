import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { GameGraphics as Game3d } from "../lib/3dGraphics";
import styles from "../styles/Game.module.scss";
import { Game, GameManager } from "../lib/game/Game";
import { generateKeyPair } from "../lib/crypto";
import { GameObject } from "../lib/game/Resolvers";
import exampleGame from "../lib/games/example";




const GameGraphics: NextPage = () => {
  const gameManager = useRef<GameManager>();
  const [gameLoaded, setGameLoaded] = useState(0);
  console.log("Loaded Page", gameLoaded, gameManager.current, gameManager.current?.game);
  useEffect(() => {
    if (typeof window !== "undefined" && gameManager.current === undefined) {
      const createdGameManger = new GameManager();
      gameManager.current = createdGameManger;
      createdGameManger.init().then(() => {
        console.log("Game Loaded", createdGameManger.game)
        if (createdGameManger?.game) createdGameManger.game.ui.prompt_start();
        setGameLoaded(current => current + 1);
      });
      return () => {
        // setGameLoaded(current => current + 1);
        // gameManager.current = undefined;
        // createdGameManger?.stop();
      };
    }
  }, [])


  // if (typeof window !== "undefined") {
  //   const createdGraphics = new Graphics();
  //   graphics.current = createdGraphics;
  //   createdGraphics.init().then(() => {
  //     if (createdGraphics?.game) createdGraphics?.start();
  //   });
  //   return () => {
  //     createdGraphics?.stop();
  //   };

  // console.log("Loaded Page" + loadNumber)

  return (
    <div style={{}}>
      <Head>
        <meta name="viewport" content="width=device-width" />
      </Head>
      <canvas id="cardCanvas" width="100" height="100"></canvas>
      <canvas className={styles.fullscreenCanvas} id="canvas" width="800" height="600"></canvas>
      <div className={styles.mainScreen}>
        <Game3d gameState={gameManager.current?.game} gameLoaded={gameLoaded} />
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

export default GameGraphics;
export function log(module: string, ...args: any[]) {
  console.log(`[${module}]`, ...args);
}
