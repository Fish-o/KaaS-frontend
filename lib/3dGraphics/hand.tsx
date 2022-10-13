import { animated, config, useSpring } from "@react-spring/three";
import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import _ from "lodash";
import { Ref, useEffect, useRef, useState } from "react";
import { BufferGeometry, Color, Material, Mesh, Vector3 } from "three";
import { useGameObject } from "../../hooks/game";
import { useCursor } from "../../hooks/pointer";
import { Game } from "../game/Game";
import { Card } from "../game/Objects/Card";
import { Hand, Player } from "../game/Objects/Player";
import { CardGraphics } from "./card";

export const HandGraphics: React.FC<{ position: Vector3; hand: Hand, player: Player, game: Game }> = ({
  position: startPos,
  hand,
  player,
  game,
}) => {
  let updater = useGameObject(hand)
  console.log("Rendering HandGraphics", hand);

  let visible = hand.visibleTo(game, player)



  return (
    <group position={startPos}>
      <pointLight
        position={new Vector3(0, 10, 10)}
        intensity={2}
        decay={5}
        distance={50}
        color={new Color().setRGB(1, 0.9, 0.9)}
      />
      {
        hand.cards.map((card, index, arr) => {
          console.log("card", card, "card" + card.id + arr.length);
          // const scaling = (1 / rowCount) * 1.1;
          const cardCount = arr.length - 1;
          // const maxOffset = cardCount * 0.5;



          let offset = cardCount / 2 - index;
          if (cardCount > 7) {
            offset = offset / cardCount * 7;
          }

          const zOffset = Math.abs(offset);

          let r = 10
          // y = \sqrt{\left(r^{2}\ -\ x^{2}\right)}-r
          // 

          let yRotation = Math.atan2((0 - offset), (-r - zOffset));

          let yOffset = -1 * (Math.sqrt(Math.pow(r, 2) - Math.pow(offset, 2)) - r);
          return (
            <CardGraphics
              rotation={[0, -yRotation + .15, 0]}
              card={card}
              key={"card" + card.id}
              position={new Vector3(offset * 6, yOffset * .1, yOffset * 6)}
              scale={1}
              visible={visible}
            />
          );
        })
      }
    </group>
  );
};

const Row: React.FC<{ row: Card[], updater: number }> = ({ row, updater }) => {
  console.log("Rendering Row", row);

  return <>
    {row.map((card, index, arr) => {
      // const scaling = (1 / rowCount) * 1.1;
      const cardCount = arr.length - 1;
      const maxOffset = cardCount * 0.5;
      const offset = cardCount / 2 - index;
      const zOffset = Math.abs(offset) - maxOffset;
      const yOffset = Math.abs(offset) - maxOffset;
      return (
        <animated.group key={"card" + card.id}>
          <CardGraphics
            card={card}
            key={"card" + card.id}
            position={new Vector3(offset * 6, yOffset * 0.2, zOffset * 1)}
            scale={1}
          />
        </animated.group>

      );
    })}
  </>
}