import {
  Canvas,
  MeshProps,
  useFrame,
  useLoader,
  useThree,
} from "@react-three/fiber";
import {
  MutableRefObject,
  Ref,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "../../styles/Game.module.scss";
import {
  ContactShadows,
  Environment,
  MeshReflectorMaterial,
  OrbitControls,
  PerspectiveCamera,
  Reflector,
  ReflectorProps,
  Stats,
  useContextBridge,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import {
  BufferGeometry,
  Color,
  Euler,
  Material,
  Mesh,
  Quaternion,
  Vector2,
  Vector3,
} from "three";
import { useSpring, animated, config } from "@react-spring/three";
import { HandGraphics } from "./hand";
import { CursorContext } from "../../hooks/pointer";
import { CardGraphics } from "./card";
import { DeckGraphics } from "./deck";
import { Game } from "../game/Game";
import UIGraphics from "./ui";
import { useGame } from "../../hooks/game";

const deg2rad = (degrees: number) => degrees * (Math.PI / 180);



export const Players: React.FC<{ game: Game }> = ({ game }) => {

  const updater = useGame(game);
  const players = game.getAllPlayers();
  const circleCenterX = 0
  const circleCenterY = 0
  const circleRadius = Math.floor(
    Math.min(100, 100) / 2 - 10
  );
  const playerCount = players.length;
  const playerAngle = (Math.PI * 2) / playerCount;
  const playerIndex = players.findIndex(
    (player) => player.user_id === game.user_id
  );
  const angleStart = Math.PI / 2 - playerAngle * playerIndex;

  // console.timeLog("render", "Drawing players..");
  return (
    <>{
      players.map((player, index, arr) => {
        const playerX =
          Math.floor(
            circleCenterX +
            Math.cos(playerAngle * index + angleStart) * circleRadius
          )
        const playerY =
          Math.floor(
            circleCenterY +
            Math.sin(playerAngle * index + angleStart) * circleRadius
          )

        return (
          <HandGraphics
            key={player.user_id}
            position={new Vector3(playerX, 3, playerY)}
            hand={player.hand} />
        )
      })
    }
    </>

  )
}

const Rig: React.FC<{ gameState: Game }> = ({ gameState }) => {
  const { camera, mouse } = useThree();
  // const [cards, setCards] = useState<ICard[]>(
  //   Array.apply(
  //     null,
  //     new Array(52).map(() => ({ id: "1", type: "2", value: 3 }))
  //   ) as ICard[]
  // );
  // const [hand, setHand] = useState<IHand>({
  //   cards: [
  //     { id: "1", type: "diamond", value: 1 },
  //     { id: "1", type: "diamond", value: 1 },
  //     { id: "1", type: "diamond", value: 1 },
  //     { id: "1", type: "diamond", value: 1 },
  //   ],
  // });

  useFrame(() => {
    // camera.position.x = 0 * 100;
    // camera.position.y = 21;
    // camera.position.z = 1 * 100;
    camera.lookAt(0, 5, 0);
  });

  return (
    <>
      <ambientLight intensity={0.01} />
      <hemisphereLight intensity={0.125} color="#8040df" groundColor="red" />

      <color attach="background" args={["#191920"]} />
      <fog attach="fog" args={["#191920", 50, 200]} />

      {/* <gridHelper args={[100, 100]} /> */}
      <ContactShadows />
      <Stats />
      <Suspense fallback={null}>
        {/* <HandGraphics position={new Vector3(0, 3, 50)} hand={gameState.getAllHands()[0]} /> */}
        <Players game={gameState} />

        {
          gameState.getAllDecks().map((deck, index) => {
            return (
              <group position={new Vector3(index * 30, 0, 0)} key={index}
              >
                <DeckGraphics
                  deck={deck} />
              </group >
            )
          })
        }

        {/* <CardGraphics
          position={new Vector3(10, 20, 50)}
          scale={0.4}
          onClick={() => {
            setHand({
              cards: [...hand.cards, { id: "1", type: "diamond", value: 5 }],
            });
          }}
        />
        <CardGraphics
          position={new Vector3(-10, 20, 50)}
          scale={0.4}
          onClick={() => {
            setHand({
              cards: hand.cards.slice(0, hand.cards.length - 1),
            });
          }}
        /> */}
      </Suspense>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={1024}
          mixBlur={1}
          opacity={2}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.25}
          roughness={1}
          mirror={0}
        />
      </mesh>
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0.001, 0]}>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial transparent color="black" opacity={0.5} />
      </mesh>
    </>
  );
};
export const GameGraphics: React.FC<{ gameState?: Game, gameLoaded: number }> = ({ gameState, gameLoaded }) => {
  console.log("GameGraphics", gameState);
  const ContextBridge = useContextBridge(CursorContext);
  const [updater, setUpdater] = useState(0);

  // Use the screen size

  if (!gameState) {
    return null;
  }
  return (
    <Canvas style={{}}>
      <ContextBridge>
        <BaseGraphics gameState={gameState} />
      </ContextBridge>
    </Canvas>
  );
};

const BaseGraphics: React.FC<{ gameState: Game }> = ({ gameState }) => {
  const ContextBridge = useContextBridge(CursorContext);
  const { size } = useThree();

  const aspect = size.width / size.height;
  return (
    <>

      <ContextBridge>
        <Rig gameState={gameState} />
      </ContextBridge>
      {/* 
      <OrbitControls
        makeDefault
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 2.3}
        minPolarAngle={Math.PI / 2.3}
        enableZoom={false}
        enablePan={false}
      /> */}
      <PerspectiveCamera makeDefault fov={75} position={[0, 20, 70]}>
        <pointLight
          position={[0, 20, 70]}
          intensity={0.7}
          color={new Color().setRGB(0.7, 0.3, 0)}
        />
        {/* A button that says click here */}
        <group position={[0, 0, -1.3]}>
          <UIGraphics ui={gameState.ui} aspect={aspect} />
        </group>

      </PerspectiveCamera>
    </>

  )
}


