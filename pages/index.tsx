import type { NextPage } from "next";
import Head from "next/head";
import { game } from "../lib/interface";
import { useEffect } from "react";

const Home: NextPage = () => {
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
    </div>
  );
};

export default Home;
