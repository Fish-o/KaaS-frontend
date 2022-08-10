import "../styles/globals.css";
import type { AppProps } from "next/app";
import Pusher from "pusher-js";
import { useEffect } from "react";

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {});
  return <Component {...pageProps} />;
}

export default MyApp;
