import { Button, Container, Input, Spacer, Text } from "@nextui-org/react";
import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/globalStyles";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NextUIProvider, useInput } from "@nextui-org/react";

import { lightTheme, darkTheme } from "../components/theme";
import DropZone from "../components/DropZone";
import { useReducer, useState, useRef } from "react";
import { GameObject } from "../lib/game/Resolvers";

function createLobby(name: string, password: string, nickname: string) {
  const params = new URLSearchParams();
  params.append("lobby", name);
  params.append("password", password);
  params.append("name", nickname);
  params.append("host", "yaaa");

  window.location.assign(`/game?${params.toString()}`);
}

function joinLobby(name: string, password: string, nickname: string) {
  const params = new URLSearchParams();
  params.append("lobby", name);
  params.append("password", password);
  params.append("name", nickname);

  window.location.assign(`/game?${params.toString()}`);
}

const Home: NextPage = () => {
  const lobby_name = useInput("");
  const lobby_password = useInput("");
  const nickname = useInput("");


  // const reducer = (state, action) => {
  //   switch (action.type) {
  //     case "SET_IN_DROP_ZONE":
  //       return { ...state, inDropZone: action.inDropZone };
  //     case "ADD_FILE_TO_LIST":
  //       return { ...state, fileList: state.fileList.concat(action.files) };
  //     default:
  //       return state;
  //   }
  // };

  // destructuring state and dispatch, initializing fileList to empty array
  // const [data, dispatch] = useReducer<{ inDropZone: boolean, fileList: number[] }>(reducer,);


  const [uploadedGameSettings, setUploadedGameSettings] = useState<GameObject>()


  const inputRef = useRef<HTMLInputElement>(null);

  styles();
  return (
    <NextThemesProvider
      defaultTheme="system"
      attribute="class"
      value={{
        light: lightTheme.className,
        dark: darkTheme.className,
      }}
    >
      <NextUIProvider>
        <Container
          lg={true}
          id="main-container"
          display="flex"
          alignContent="center"
          direction="column"
          css={{
            minHeight: "100vh",
          }}
        >
          <Text as="h1" css={{ marginTop: "50px" }}>
            Play card games!
          </Text>
          <Text as="h2" css={{ marginTop: "10px" }}>
            You don&apos;t have a choice!
          </Text>
          <Text as="h3" css={{ marginTop: "-5px" }}>
            you, you, must
          </Text>
          <Text as="h4" css={{ marginTop: "-5px" }}>
            play, play
          </Text>
          <Text as="h5" css={{ marginTop: "-10px" }}>
            them
          </Text>

          <Spacer />

          <Input {...lobby_name.bindings} placeholder="Lobby Name" clearable />
          <Spacer />
          <Input
            {...lobby_password.bindings}
            placeholder="Lobby password"
            clearable
          />
          <Spacer />
          <Input {...nickname.bindings} placeholder="Nickname" clearable />
          <Spacer />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "20px",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Button
              shadow
              css={{ flex: 1 }}
              onClick={() =>
                joinLobby(
                  lobby_name.value,
                  lobby_password.value,
                  nickname.value
                )
              }
            >
              Join lobby
            </Button>
            <Button
              shadow
              css={{ flex: 1 }}
              bordered
              color="gradient"
              onClick={() =>
                createLobby(
                  lobby_name.value,
                  lobby_password.value,
                  nickname.value
                )
              }
            >
              Create new lobby
            </Button>


            {/* <input
              type="file"
              id="file"

              onChange={(e) => {
                setFileList([...fileList, ...Array.from(e.target.files)])
              }}

            > */}
            <label className="custom-file-upload">
              <input type="file" multiple style={{ display: "none" }} ref={inputRef} accept=".json" onChange={(e) => {
                let jsonData: GameObject
                let files = Array.from(e.target.files ?? [])

                if (files.length > 0) {
                  let file = files[0];
                  let reader = new FileReader();
                  reader.readAsText(file, "UTF-8");
                  reader.onload = (evt) => {
                    try {
                      if (evt.target) {
                        jsonData = JSON.parse(evt.target.result as string)
                        setUploadedGameSettings(jsonData)
                        //Store the settings in local
                        localStorage.setItem("gameSettings", JSON.stringify(jsonData))

                        console.log(jsonData)
                      }
                    }
                    catch (e) {
                      console.error(e)
                    }

                  }
                  reader.onerror = (evt) => {
                    console.log(evt)
                  }
                }
              }} />

              <i className="fa fa-cloud-upload">
                <Button
                  shadow
                  css={{ flex: 1 }}
                  bordered
                  color="gradient"
                  onClick={() => {
                    inputRef.current?.click()
                  }
                    // createLobby(
                    //   lobby_name.value,
                    //   lobby_password.value,
                    //   nickname.value
                    // )
                  }
                >
                  {uploadedGameSettings ? 'game "' + uploadedGameSettings.name + '" selected' : "Upload Game rules"}
                </Button>
              </i>
            </label>

          </div>
        </Container>
        <style global jsx>{`
          .noselect {
            -webkit-touch-callout: none; /* iOS Safari */
            -webkit-user-select: none; /* Safari */
            -khtml-user-select: none; /* Konqueror HTML */
            -moz-user-select: none; /* Firefox */
            -ms-user-select: none; /* Internet Explorer/Edge */
            user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome and Opera */
          }
        `}</style>
      </NextUIProvider>
    </NextThemesProvider >
  );
};

export default Home;
