import { animated } from "@react-spring/three";
import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { MutableRefObject, Ref, useRef, useEffect } from "react";
import { Color, Object3D, SpotLight, Vector3 } from "three";
import { DEG2RAD, degToRad } from "three/src/math/MathUtils";
import { useGameObject } from "../../hooks/game";
import { Card } from "../game/Objects/Card";
import { Deck } from "../game/Objects/Deck";
import config from "../graphics/config";
import { SimpleCard } from "./card";



export const DeckGraphics: React.FC<{
  deck: Deck;
  position?: Vector3;
  scale?: number;
}> = ({ deck, scale, position }) => {
  const updater = useGameObject(deck)
  const { scene } = useThree();
  const light = useRef<SpotLight>(null);
  const obj = useRef<Object3D>(null);

  useEffect(() => {
    light.current?.lookAt(obj.current?.position ?? new Vector3(0, 1, 0));
  }, [scene, light]);
  const [KingOfDiamonds] = useTexture(["/card_images/2_of_clubs.png"]);

  // const lightRef = useRef<SpotLight>() as MutableRefObject<SpotLight | null>;
  useFrame(() => {
    // const light = lightRef.current;
    // if (light) {
    // light.target.position.x = 200;
    // light.target.position.y = 100;
    // light.target.position.z = 0;
    // }
  });

  let displayAmount = deck.cards.length;
  if (config.deck.maxDisplay) {
    displayAmount = Math.min(config.deck.maxDisplay, displayAmount);
  }

  let cards: Card[] = deck.cards.slice(-displayAmount);
  cards.reverse()
  let rotation = [degToRad(-90), 0, 0]


  return (


    <group position={position}>
      <object3D position={position} ref={obj}>

        {/* <group > */}
        {cards.map((card, index) => {
          const position = new Vector3();
          position.y += index * 0.05;

          return (
            <SimpleCard
              key={index}
              card={card}
              scale={scale}
              position={position}
              rotation={[degToRad(-90), 0, 0]}

            />
          );
        })}
        {/* </group> */}
      </object3D>
      <spotLight
        ref={light}
        rotation={[degToRad(-90), 0, 0]}
        target={obj.current ?? undefined}
        position={new Vector3(0, 0 + 15 + displayAmount * 0.05, 0)}
        penumbra={1}
        decay={2}
        intensity={0.3}
        angle={Math.PI / 6}

      />
    </group >
  );
};
