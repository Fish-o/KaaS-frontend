import { Button, Container, Input, Spacer, Text } from "@nextui-org/react";
import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/globalStyles";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NextUIProvider, useInput } from "@nextui-org/react";

import { lightTheme, darkTheme } from "../components/theme";

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
    </NextThemesProvider>
  );
};

export default Home;
