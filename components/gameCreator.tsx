import { drop, isArray, isNumber, throttle } from 'lodash';

declare global {
  export interface ObjectConstructor {
    uniqueID: (arg0: any) => number
  }
}

(function () {
  //@ts-ignore
  if (typeof Object.uniqueID == "undefined") {
    let id = 0;
    // @ts-ignore
    Object.uniqueID = function (o) {
      if (typeof o.__uniqueid == "undefined") {
        Object.defineProperty(o, "__uniqueid", {
          value: ++id,
          enumerable: false,
          // This could go either way, depending on your 
          // interpretation of what an "id" is
          writable: false
        });
      }

      return o.__uniqueid;
    };
  }
})();



export const CANVASSIZE = 10000
export const HELDCONTAINEROFFSET = 30000

import { Button, Dropdown, FormElement, Input } from "@nextui-org/react";
import React, { LegacyRef, memo, useContext, useEffect, useId, useMemo, useRef } from "react";
import useState from 'react-usestateref'
import { Action, Variable } from "../lib/game/Actions";
import { Filter } from "../lib/game/Filters";
import exampleGame from "../lib/games/example";
import styles from "../styles/gameCreator.module.scss";
import { EventObject } from "../lib/game/Events"
import { Condition } from '../lib/game/Conditions';
import NoSSRProvider from './noSSRProvider';

import TopMenuBar from './gameCreator/TopMenuBar';
import DraggableObject from './gameCreator/draggableObject'
import DropPosition, { DropPositionObject } from './gameCreator/DropPosition';
import { ResolveNodeType } from './gameCreator/resolveNodeType';
import { CardHolderResolvable, CardResolvable, DeckResolvable, HandResolvable, PlayerResolvable, Resolvable } from '../lib/game/Actions/resolvables';
import { GameObject } from '../lib/game/Resolvers';
import { MethodObject } from '../lib/game/Method';
import { UserInput } from '../lib/game/Input';


type IDdAction = Action & {
  id?: () => number

}
type ObjectType = "action" | "event" | null



interface GrabbedObjectBase {
  clientX: number,
  clientY: number,
  width: number | null,
  height: number | null,
  zindex?: number,
  dontGrabImmediately?: boolean,
}


export type ObjectTypes = (Action | EventObject | Filter | Condition | MethodObject | UserInput)

export type GrabbedObject = GrabbedObjectBase & { data: ObjectTypes }
export type ObjectDatas = (Action["args"] | Action["returns"] | Filter["filter"] | Condition["condition"] | UserInput["input"])
export type NodableObjectTypes = (Action | Filter | Condition | UserInput)

export type KeysOfUnion<T> = T extends T ? keyof T : never
interface DraggableContextType {
  activeDropPoints: { [key: string]: DropPositionObject }
  detachedCanvasRef: React.RefObject<HTMLDivElement>
}



type NodeObjects = GrabbedObject[]


export const DraggableScale = React.createContext<number>(1);
export const SetDraggableScale = React.createContext<React.Dispatch<React.SetStateAction<number>> | null>(null);

//@ts-ignore
export const DraggableContext = React.createContext<DraggableContextType>({});
export const SetDraggableContext = React.createContext<React.Dispatch<React.SetStateAction<DraggableContextType>> | null>(null);
export const DraggableContextRef = React.createContext<React.RefObject<DraggableContextType> | null>(null);
//@ts-ignore
export const DraggableNodeObjects = React.createContext<NodeObjects>([]);
export const SetDraggableNodeObjects = React.createContext<React.Dispatch<React.SetStateAction<NodeObjects>> | null>(null);

//@ts-ignore
export const GrabbedObjectContext = React.createContext<GrabbedObject | null>(null);
export const SetGrabbedObjectContext = React.createContext<React.Dispatch<React.SetStateAction<GrabbedObject | null>>>(() => { });
export const RefGrabbedObjectContext = React.createContext<React.RefObject<GrabbedObject | null> | null>(null);

export const GrabbedObjectTypeContext = React.createContext<GrabbedObject["data"]["type"] | null>(null);




export const ObjectIsGrabbedContext = React.createContext<boolean>(false);
export const DeleteSelfContext = React.createContext<(() => void) | null>(null);



export const GameCreator: React.FC = () => {
  const gameData = useMemo<GameObject>(() => {
    let gameDataString = window.localStorage.getItem("gameSettings");
    if (gameDataString) {
      return JSON.parse(gameDataString) as GameObject;
    }
    return exampleGame;
  }, [])
  const detachedCanvasRef = useRef<HTMLDivElement>(null)

  const [draggableScale, setDraggableScale] = useState(1)
  const [draggableContext, setDraggableContext, draggableContextRef] = useState<DraggableContextType>({
    activeDropPoints: {},
    detachedCanvasRef,
  });
  const [nodeObjects, setNodeObjects] = useState<NodeObjects>(() => {
    let x = 0;
    let y = 0;
    let seedData = [...gameData.events, ...(gameData.methods ?? [])]

    return seedData.map((data) => {
      x += 100;
      y += 100
      return {
        clientX: x,
        clientY: y,
        width: null,
        height: null,
        data,
        type: "event",
        zindex: 0,
        dontGrabImmediately: true,
      }
    }) as NodeObjects
  });


  const [grabbedObject, setGrabbedObject, grabbedObjectRef] = useState<GrabbedObject | null>(null);

  return (
    <NoSSRProvider>

      <DraggableContext.Provider value={draggableContext}>
        <SetDraggableContext.Provider value={setDraggableContext}>
          <DraggableContextRef.Provider value={draggableContextRef}>

            <DraggableScale.Provider value={draggableScale}>
              <SetDraggableScale.Provider value={setDraggableScale}>

                <DraggableNodeObjects.Provider value={nodeObjects}>
                  <SetDraggableNodeObjects.Provider value={setNodeObjects}>


                    <GrabbedObjectContext.Provider value={grabbedObject}>
                      <SetGrabbedObjectContext.Provider value={setGrabbedObject}>
                        <RefGrabbedObjectContext.Provider value={grabbedObjectRef}>
                          <GrabbedObjectTypeContext.Provider value={grabbedObject?.data.type ?? null}>

                            <TopMenuBar gameSettings={gameData} />
                            <DraggableCanvas detachedCanvasRef={detachedCanvasRef} />

                          </GrabbedObjectTypeContext.Provider>
                        </RefGrabbedObjectContext.Provider>
                      </SetGrabbedObjectContext.Provider>
                    </GrabbedObjectContext.Provider>

                  </SetDraggableNodeObjects.Provider>
                </DraggableNodeObjects.Provider>

              </SetDraggableScale.Provider >
            </DraggableScale.Provider >

          </DraggableContextRef.Provider>
        </SetDraggableContext.Provider>
      </DraggableContext.Provider >

    </NoSSRProvider>

  );
};













type InitializeType<T> = {
  [K in keyof T]-?: string extends T[K]
  ? ""
  : number extends T[K]
  ? 0
  : boolean extends T[K]
  ? false
  : Array<any> extends T[K]
  ? []
  : object extends T[K]
  ? {}
  : T[K];
};
const DraggableCanvasObjects: React.FC = memo(() => {
  const nodeObjects = useContext(DraggableNodeObjects)
  const setNodeObjects = useContext(SetDraggableNodeObjects)

  return (
    <>
      {nodeObjects.map((grabbedObject, i) => {
        return (
          <div style={{ position: "relative", zIndex: grabbedObject.zindex }} key={"testingKey" + i} >
            <DeleteSelfContext.Provider value={() => {
              setNodeObjects?.((current) => {
                current.splice(i, 1);
                return [...current];
              });
            }}>
              <DraggableObject draggableObject={grabbedObject} key={"testingKey2" + i} detached={true} onDelete={
                () => {
                  setNodeObjects?.((current) => {
                    current.splice(i, 1);
                    return [...current];
                  });
                }
              }
              >
                <ResolveNodeType objectData={grabbedObject.data} key={"testingKey3" + i} />
              </DraggableObject>
            </DeleteSelfContext.Provider>
          </div>
        );
      })}
    </>
  )
})
DraggableCanvasObjects.displayName = "DraggableCanvasObjects"
DraggableCanvasObjects.whyDidYouRender = true





const DraggableCanvas: React.FC<{ detachedCanvasRef: React.RefObject<HTMLDivElement> }> = ({ detachedCanvasRef }) => {

  const setScale = useContext(SetDraggableScale)
  const [held, setHeld] = useState(false)
  const [diff, setDiff] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ left: 0, top: 0 })

  const grabbedObjectRef = useContext(RefGrabbedObjectContext)

  const dragStart = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (grabbedObjectRef?.current) return null

    window.getSelection()?.removeAllRanges();
    const ctBounds = detachedCanvasRef.current?.getBoundingClientRect();
    if (!ctBounds) return
    if (position.left !== ctBounds.left || position.top !== ctBounds.top) {
      setPosition((current) => ({
        ...current,
        left: ctBounds.left,
        top: ctBounds.top
      }))
    }


    setDiff(
      {
        x: e.clientX - ctBounds.left,
        y: e.clientY - ctBounds.top
      }
    )

    setHeld(true);
    e.stopPropagation()

  }
  const dragging = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!held) return
    window.getSelection()?.removeAllRanges();

    if (position.left !== e.clientX - diff.x || position.top !== e.clientY - diff.y) {
      setPosition((current) => ({
        ...current,
        left: e.clientX - diff.x,
        top: e.clientY - diff.y,
      }))
    }
  }
  const dragEnd = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {

    setHeld(false);
  }
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();

    setScale?.(scale => {
      const delta = e.deltaY;
      const newScale = scale - (delta / 1000);
      if (newScale < 0.1) return scale
      if (newScale > 1) return scale

      let mouseXBeforeT = e.clientX - position.left;
      let mouseYBeforeT = e.clientY - position.top;
      let mouseXBefore = mouseXBeforeT / scale;
      let mouseYBefore = (mouseYBeforeT / scale)
      let mouseXAfter = mouseXBeforeT / newScale
      let mouseYAfter = mouseYBeforeT / newScale
      let diffX = (mouseXAfter - mouseXBefore) * newScale
      let diffY = (mouseYAfter - mouseYBefore) * newScale

      setPosition((current) => ({
        ...current,
        left: current.left + diffX,
        top: current.top + diffY,
      }))
      return newScale
    })
  }

  return (
    // <Draggable>
    <div className={styles.detachedObjectsCanvasWindow}>
      <div className={styles.detachedObjectsCanvas} onMouseDown={dragStart} onMouseMoveCapture={dragging} onMouseUpCapture={dragEnd} onWheelCapture={onWheel}>
        <div className={styles.detachedObjectsCanvasRoot} ref={detachedCanvasRef} style={{ ...position }}>
          <DraggableCanvasObjects />
        </div>
      </div>
    </div>
  );
}
// DraggableCanvas.whyDidYouRender = true


function getPrototype<T>(t: T): InitializeType<T> {
  return t as InitializeType<T>;
}





type PartialRecord<K extends keyof any, T> = {
  [P in K]?: T;
};












export const VariableNode: React.FC<{
  returns: Partial<{
    moved_cards: `$${string}`;
    destination: `$${string}`;
  }> | Partial<{
    found_many: `$${string}`;
    found_one: `$${string}`;
  }> | {
    [key: string]: `$${string}`;
  } | {
    selected?: `$${string}`;
  }
}> = ({ returns }) => {
  let filterName = "{BLANK}"
  //@ts-ignore  
  if (returns.found_many) {
    //@ts-ignore  
    filterName = returns.found_many
  }
  //@ts-ignore

  if (returns.found_one) {
    //@ts-ignore  
    filterName = returns.found_one

  }

  return (

    <div className={styles.returnsNode}>
      <h3>{filterName}</h3>
    </div>
  );

};


