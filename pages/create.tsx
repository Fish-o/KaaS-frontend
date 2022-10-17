import { NextPage } from "next";
import { useRef } from "react";
import { GameCreator } from "../components/gameCreator";
import NoSSR from "../components/noSSR";
const CreateGame: NextPage = () => {
  if (typeof window === "undefined") return <></>;
  return (
    <NoSSR>
      <div style={{}}>
        <GameCreator />
      </div>
    </NoSSR>
  );
};

export default CreateGame;
