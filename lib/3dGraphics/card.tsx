import {
  animated,
  AnimatedComponent,
  config,
  useSpring,
} from "@react-spring/three";
import { useTexture } from "@react-three/drei";
import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import { FC, MutableRefObject, Ref, useRef, useState } from "react";
import { BufferGeometry, Material, Mesh, Vector3 } from "three";
import { useGameObject } from "../../hooks/game";
import { useCursor } from "../../hooks/pointer";
import { Card } from "../game/Objects/Card";

export const CardGraphics: React.FC<{
  card: Card;
  position: Vector3;
  groupPos?: Vector3;
  // @ts-ignore
  rotation?: Euler;
  scale: number;
  onClick?: () => void | any;
  visible: boolean;
}> = ({ card, position: startPos, scale: scaleModifier, onClick, groupPos, rotation, visible }) => {
  const posVec = startPos.clone();




  const updater = useGameObject(card);


  // This reference will give us direct access to the mesh
  // const mesh = useRef<Mesh>() as MutableRefObject<
  //   Mesh<BufferGeometry, Material | Material[]>
  // >;
  // Set up state for the hovered and active state
  const [hover, setHover] = useState(false);
  const [mouseDown, setMouseDown] = useState(false);
  const [KingOfDiamonds] = useTexture(["card_images/" + (visible ? card.imageName : "back.jpg")]);
  // Subscribe this component to the render-loop, rotate the mesh every frame
  // useFrame((state, delta) => (mesh.current!.rotation.y += 0.01));
  const { camera } = useThree();
  // const { setClickable } = useCursor();
  const vector = new Vector3();
  if (groupPos) vector.add(camera.position).sub(posVec.clone().add(groupPos));
  else vector.add(camera.position).sub(posVec);

  // posVec.add(
  //   vector
  //     .clone()
  //     .normalize()
  //     .multiplyScalar(mouseDown ? 2 : hover ? 8 : 0)
  // );
  if (mouseDown && card.selectable) {
    posVec.add(
      new Vector3(0, 4, 0)
    )
  }
  else if (card.selected) {
    posVec.add(
      new Vector3(0, 3, 0)
    )
  }
  else if (hover && card.selectable) {
    posVec.add(
      new Vector3(0, 2, 0)
    )
  }
  else if (card.selectable) {
    posVec.add(
      new Vector3(0, 1, 0)
    )
  }

  const { position } = useSpring({
    position: posVec.toArray(),
    config: {
      tension: 800,
      friction: 30,
      damping: 400,
    },
  });

  // const rot = mesh.current?.rotation;
  // if (rot) {
  let rotationX = -vector.x / vector.length();
  let rotationY = -vector.y / vector.length();

  // rot.x = rotationX * 0.1;
  // rot.y = rotationY * 0.1;
  // }

  // Return view, these are regular three.js elements expressed in JSX
  return (
    <animated.mesh
      // ref={mesh}
      scale={scaleModifier}
      position={position}
      // rotation={[rotationY, -rotationX, 0]}
      rotation={rotation}
      // onClick={(event) => setActive(!active)}
      // onPointerOver={(event) => {
      //   setHover(true);
      // }}
      onPointerOut={(event) => {
        // if (event.intersections.length === 0) setClickable(false);
        setHover(false);
        setMouseDown(false);
      }}
      onPointerMove={(event) => {
        if (event.intersections[0].distance === event.distance) {
          setHover(true);
          // setClickable(true);
        } else if (hover) setHover(false);
      }}
      // onPointerEnter={(event) => {
      //   // setClickable(true);
      //   setHover(true);
      // }}
      // onPointerLeave={(event) => {
      //   // setClickable(false);
      //   setHover(false);
      // }}
      onPointerDown={(event) => {
        if (event.intersections[0].distance === event.distance) {
          if (card.selectable) {
            setMouseDown(true);
          }
        }
      }}
      onPointerUp={(event) => {
        setMouseDown(false);
        console.log("click");
        card.onSelect(card)
      }}
    >
      <boxGeometry args={[5.6, 8.8, 0.1]} />
      <meshLambertMaterial map={KingOfDiamonds} toneMapped={false} />
      {/* // <meshLambertMaterial map={KingOfDiamonds} toneMapped={false} /> */}
    </animated.mesh>
  );
};


export const SimpleCard: React.FC<{
  position: Vector3;
  scale?: number;
  rotation: [x: number, y: number, z: number, order?: string | undefined];
  card: Card;
}> = ({ position, scale, rotation, card }) => {
  const [KingOfDiamonds] = useTexture(["card_images/" + (card.imageName)]);

  return (
    <animated.mesh
      scale={scale ?? 1}
      position={position}
      rotation={rotation}
    >
      <planeGeometry args={[5.6, 8.8]} />
      <meshLambertMaterial toneMapped={false} map={KingOfDiamonds} />
    </animated.mesh>
  )
}