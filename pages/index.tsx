import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import "../interface";
const Home: NextPage = () => {
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
