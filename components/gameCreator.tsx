/* eslint-disable react-hooks/rules-of-hooks */
import { useAutoAnimate } from '@formkit/auto-animate/react'
// import NoSSR from 'react-no-ssr';
import { drop, isArray, isNumber, throttle } from 'lodash';

declare global {
  export interface ObjectConstructor {
    uniqueID: (arg0: any) => number
  }
}

(function () {
  //@ts-ignore
  if (typeof Object.uniqueID == "undefined") {
    var id = 0;
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

import { Dropdown, Input } from "@nextui-org/react";
import React, { LegacyRef, memo, useContext, useEffect, useId, useMemo, useRef } from "react";
import useState from 'react-usestateref'
import { Action, Variable } from "../lib/game/Actions";
import { Filter } from "../lib/game/Filters";
import exampleGame from "../lib/games/example";
import styles from "../styles/gameCreator.module.scss";
import { EventObject } from "../lib/game/Events"
import { findIndex } from "lodash";
import { debug, time } from 'console';
import { Condition } from '../lib/game/Conditions';
import NoSSRProvider from './noSSRProvider';

import TopMenuBar from './gameCreator/TopMenuBar';
import DraggableObject from './gameCreator/draggableObject'
import DropPosition, { DropPositionObject } from './gameCreator/DropPosition';
import { ResolveNodeType } from './gameCreator/resolveNodeType';
import { FilterNode } from './gameCreator/FilterNode';
import { CardHolderResolvable, CardResolvable, DeckResolvable, HandResolvable, PlayerResolvable, Resolvable } from '../lib/game/Actions/resolvables';
import { GameObject } from '../lib/game/Resolvers';




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


export type ObjectTypes = (Action | EventObject | Filter | Condition)
export type GrabbedObject = GrabbedObjectBase & { data: ObjectTypes }



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



export const GameCreator: React.FC = () => {
  if (typeof window === "undefined")
    return <></>


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
    // let x = CANVASSIZE;
    let x = 0;
    // let y = CANVASSIZE;
    let y = 0;
    let seedData = [...gameData.events]

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
        <DraggableScale.Provider value={draggableScale}>
          <SetDraggableScale.Provider value={setDraggableScale}>
            <SetDraggableContext.Provider value={setDraggableContext}>
              <DraggableContextRef.Provider value={draggableContextRef}>
                <DraggableNodeObjects.Provider value={nodeObjects}>
                  <SetDraggableNodeObjects.Provider value={setNodeObjects}>
                    <GrabbedObjectContext.Provider value={grabbedObject}>
                      <SetGrabbedObjectContext.Provider value={setGrabbedObject}>
                        <RefGrabbedObjectContext.Provider value={grabbedObjectRef}>
                          <TopMenuBar gameSettings={gameData} />
                          <DraggableCanvas detachedCanvasRef={detachedCanvasRef} />
                        </RefGrabbedObjectContext.Provider>
                      </SetGrabbedObjectContext.Provider>
                    </GrabbedObjectContext.Provider>
                  </SetDraggableNodeObjects.Provider>
                </DraggableNodeObjects.Provider>
              </DraggableContextRef.Provider>
            </SetDraggableContext.Provider>
          </SetDraggableScale.Provider >
        </DraggableScale.Provider >
      </DraggableContext.Provider >
    </NoSSRProvider>

  );
};













type InitializeType<T> = {} & {
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
      let scaleChange = newScale / scale;
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

// declare function getPrototype<T>(): InitializeType<T>;

function getPrototype<T>(t: T): InitializeType<T> {
  return t as InitializeType<T>;
}





type PartialRecord<K extends keyof any, T> = {
  [P in K]?: T;
};










const ResolveGrabbedNode: React.FC<{ data: ObjectTypes | string, i?: number, object: any, $key: string, held: boolean, allowedDropTypes: ObjectTypes["type"], setUpdater: React.Dispatch<React.SetStateAction<number>> }> = ({ data, i, object, $key, held, allowedDropTypes, setUpdater }) => {
  if (typeof data === "string") {
    return (
      <DropPosition config={{ type: allowedDropTypes }} onDrop={(grabbedObject) => {
        if (i) {
          object[$key].splice(i, 0, grabbedObject)
          setUpdater(current => current + 1)
        }

        return true;
      }} disable={held}>
        <Input
          value={data || typeof data}
          aria-label={"Argument input"}
        />
      </DropPosition >
    )
  }
  if (isNumber(i)) {
    return <>

      <DraggableObject fillData={data} onGrab={(grabbedObject) => {
        if (isNumber(i)) {
          object[$key].splice(i, 1)
          setUpdater(current => current + 1)
        }
      }}>
        <ResolveNodeType objectData={data} held={held} />

      </DraggableObject>
      <DropPosition onDrop={(grabbedObject) => {
        if (isNumber(i)) {
          object[$key].splice(i + 1, 0, grabbedObject.data)
          setUpdater(current => current + 1)
          return true;
        }
        return false
      }} disable={held}
        config={{
          overHeight: 0,
          overWidth: 0,
          activeStyle: {
            marginTop: "10px",
            marginBottom: "10px",
          },
          inactiveStyle: {
            marginTop: "5px",
            marginBottom: "5px",
            width: "100%",
          },
          type: allowedDropTypes
        }}


      />
    </>
  }
  return (<DraggableObject fillData={data} onGrab={(grabbedObject) => {
    object[$key] = undefined
    setUpdater(current => current + 1)
  }}>
    <ResolveNodeType objectData={data} held={held} />

  </DraggableObject>)
}

type AcceptableTypes = "string" | "array" | GrabbedObject["data"]["type"]

type AccetableValueTypes = string | number | boolean | Filter | Action | Condition | AccetableValueTypes[]

export const TypedArgument: React.FC<
  {
    $key: string,
    value: AccetableValueTypes | (AccetableValueTypes)[] | undefined,
    object: Action["args"] | Filter["filter"] | Condition,
    type: (Action | Filter | Condition)["type"],
    held: boolean,
    rootHeld?: boolean,
    setUpdater: React.Dispatch<React.SetStateAction<number>>,
    orientation?: "horizontal" | "vertical",
  }>
  = memo(({ $key: key, value, object, type, held = false, rootHeld = false, setUpdater, orientation }) => {
    const [errorValue, setErrorValue] = React.useState(value)
    held = held || rootHeld
    const acceptableTypes = (
      TypedNodeProperties[type] as unknown as {
        [key: string]: AcceptableTypes[] |
        {
          [key: string]: AcceptableTypes[] |
          {
            [key: string]: AcceptableTypes[] |
            {
              [key: string]: AcceptableTypes[]
            }
          }
        }
      })[key];

    let inputAllowed = false;
    let multipleAllowed = false;
    let stringsAllowed = false;
    if (!Array.isArray(acceptableTypes)) return <h1>TypedNodeProperties IS MISSING AN ENTRY FOR {type}</h1>;
    // if (Array.isArray(accetableTypes)) {
    if (acceptableTypes.includes("string")) {
      inputAllowed = true;
    }
    if (acceptableTypes.includes("array")) {
      multipleAllowed = true;
    }
    if (acceptableTypes.includes("string")) {
      stringsAllowed = true;
    }

    let literalStrings = acceptableTypes.filter((type) => type.startsWith("string:"))
    // @ts-ignore
    literalStrings = literalStrings.map((type) => ({ key: type.replace("string:", ""), value: type.replace("string:", "") })) as { key: string, value: string }[]

    let actualTypes = acceptableTypes.filter(value => value != "string" && value != "array") as unknown as ObjectTypes["type"]
    if (!object || !(key in object)) {
      return <h1>GIVEN OBJECT IS MISSING AN ENTRY FOR KEY {key} {JSON.stringify(object)}</h1>;
    }
    // @ts-ignore
    value = object[key] as string | Filter | Filter[] | undefined;
    if (typeof value === "undefined") {
      value = "[undefined]"
    }

    if (typeof value === "object" && multipleAllowed && !isArray(value)) {
      // @ts-ignore
      object[key] = [value]
      // @ts-ignore
      value = object[key] as string | Filter | (string | Filter)[] | undefined;
    }

    if (isArray(value) && value) {
      value = value as Filter[]
      return (
        <div className={styles.rowList}>
          <h3>{key}:</h3>
          <div className={orientation == "horizontal" ? styles.rowList : styles.columnList}>

            <DropPosition config={{ type: actualTypes }} onDrop={(grabbedObject) => {
              // @ts-ignore
              (value as (string | Filter | Action)[]).splice(0, 0, grabbedObject.data);
              setUpdater((current: number) => current + 1)
              return true;
            }} disable={held} />

            {
              value.map((a, i) => (
                <ResolveGrabbedNode
                  allowedDropTypes={actualTypes}
                  // @ts-ignore
                  data={a}
                  i={i}
                  object={object}
                  $key={key}
                  held={held}
                  setUpdater={setUpdater}
                  key={Object.uniqueID(a)}
                />
              )
              )


            }

          </div>



        </div>

      )

    }

    if (typeof value === "object") {
      return (<div className={styles.filterArgument}>
        <h3>{key}:</h3>
        {/* @ts-ignore */}
        {/* <DraggableObject fillData={value}
          onGrab={
            () => {
              // @ts-ignore
              object[key] = undefined;
              setUpdater(current => current + 1);

            }}>
          <> */}
        <ResolveGrabbedNode
          allowedDropTypes={actualTypes}
          // @ts-ignore
          data={value}
          object={object}
          $key={key}
          held={held}
          setUpdater={setUpdater}
          key={Object.uniqueID(value)}
        />
        {/* </> */}
        {/* </DraggableObject> */}
      </div>)
    }
    if (typeof value === "string") {

      return (
        <div className={styles.filterArgument}>
          <h3>{key}:</h3>
          <DropPosition config={{ type: actualTypes }} onDrop={(grabbedObject) => {
            // @ts-ignore
            object[key] = grabbedObject.data;
            setUpdater(current => current + 1)
            return true;
          }} disable={held} key={value} >
            <div onClick={(e) => {
              e.stopPropagation();
              // e.preventDefault();
            }} onMouseDown={(e) => {
              e.stopPropagation();
              // e.preventDefault();
            }}  >
            </div>
          </DropPosition>
          <Input initialValue={value} onClick={(e) => {
            e.stopPropagation();
          }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onBlur={(e) => {
              // @ts-ignore
              object[key] = e.target.value;
              setUpdater(current => current + 1)
            }}
            onChange={(e) => {
              // @ts-ignore
              object[key] = e.target.value;
              setUpdater(current => current + 1)
            }}
            aria-label={"Argument input"}

          />

        </div>
      )
    }
    if (typeof value === "number") {

      return (
        <div className={styles.filterArgument}>
          <h3>{key}:</h3>
          <DropPosition config={{ type: actualTypes }} onDrop={(grabbedObject) => {
            // @ts-ignore
            object[key] = grabbedObject.data;
            setUpdater(current => current + 1)
            return true;
          }} disable={held} key={value} >
            <div onClick={(e) => {
              e.stopPropagation();
              // e.preventDefault();
            }} onMouseDown={(e) => {
              e.stopPropagation();
              // e.preventDefault();
            }}  >
            </div>
          </DropPosition>
          <Input initialValue={errorValue?.toString()} onClick={(e) => {
            e.stopPropagation();
          }}
            type="number"
            // @ts-ignore
            status={isNaN(parseInt(errorValue ?? "n")) ? "error" : "default"}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onBlur={(e) => {
              let num = parseInt(e.target.value);
              if (isNaN(num)) {
                setErrorValue(e.target.value)
                console.log("Inputed a NON NUMBER")
              }
              else {
                // @ts-ignore
                object[key] = num;
                setErrorValue(e.target.value)
                setUpdater(current => current + 1)
              }
            }}
            onChange={(e) => {
              let num = parseInt(e.target.value);
              if (isNaN(num)) {
                setErrorValue(e.target.value)
                console.log("Inputed a NON NUMBER")
              }
              else {
                // @ts-ignore
                object[key] = num;
                setErrorValue(e.target.value)
                setUpdater(current => current + 1)
              }
            }}
            aria-label={"Argument input"}

          />

        </div>
      )
    }

    return <h1>ERROR typeof value: {typeof value}</h1>








    // return (
    //   <div className={styles.filterArgument}>
    //     <h3>{key}:</h3>
    //     <Input
    //       value={cardValue || typeof cardValue}
    //       aria-label={"Argument input"}
    //     />
    //   </div>
    // )



    // if (!(key in filter.filter)) return null

    // switch (filter.type) {
    //   case "filter:card":
    //     let cardValue = filter.filter[key as keyof CardFilterObject["filter"]];
    //     if (typeof cardValue === "string") {
    //       return (
    //         <div className={styles.filterArgument}>
    //           <h3>{key}:</h3>
    //           <Input
    //             value={cardValue || typeof cardValue}
    //             aria-label={"Argument input"}
    //           />
    //         </div>
    //       )

    //     }
    //     if (key == "inside") {
    //       if (typeof filter.filter["inside"] === "object") {
    //         return (
    //           <>
    //             <div className={styles.filterArgument}>
    //               <h3>{key}:</h3>
    //               <DraggableObject fillProps={{ type: 'filter:cardHolder', data: filter.filter["inside"] }}
    //                 onGrab={
    //                   () => {
    //                     filter.filter["inside"] = undefined;
    //                     setUpdater(current => current + 1)
    //                   }}>
    //                 <FilterNode filter={filter.filter["inside"]} />
    //               </DraggableObject>
    //             </div>
    //           </>
    //         )
    //       } else {
    //         return (
    //           <div className={styles.filterArgument}>
    //             <h3>{key}:</h3>
    //             <DropPosition config={{ type: "filter:cardHolder" }} onDrop={(grabbedObject) => {
    //               // if (grabbedObject.type !== "filter:cardHolder") return false;
    //               filter.filter["inside"] = grabbedObject.data;
    //               setUpdater(current => current + 1)
    //               return true;
    //             }} >

    //               <Input
    //                 value={cardValue || typeof cardValue}
    //                 aria-label={"Argument input"}
    //               />
    //             </DropPosition>
    //           </div>
    //         )
    //       }
    //     }




    //     return (
    //       <div className={styles.filterArgument}>
    //         <h3>{key}:</h3>
    //         <h3>{JSON.stringify(cardValue)}</h3>
    //       </div>
    //     )
    //     break
    //   case "filter:deck":
    //     let deckValue = filter.filter[key as keyof DeckFilterObject["filter"]];
    //     if (typeof deckValue === "string") {
    //       return (
    //         <div className={styles.filterArgument}>
    //           <h3>{key}:</h3>
    //           <Input
    //             value={deckValue || typeof deckValue}
    //             aria-label={"Argument input"}
    //           />
    //         </div>
    //       )

    //     }
    //     return (
    //       <div className={styles.filterArgument}>
    //         <h3>{key}:</h3>
    //         <h3>{JSON.stringify(deckValue)}</h3>
    //       </div>
    //     )


    //     break
    //   default:
    //     break
    // }


    // return (
    //   <h2>
    //     {key}: {JSON.stringify(filter.filter)}
    //   </h2>
    // );

  });
TypedArgument.displayName = "FilterArgument";






type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never
type LastOf<T> =
  UnionToIntersection<T extends any ? () => T : never> extends () => (infer R) ? R : never

type Push<T extends any[], V> = [...T, V];
type TuplifyUnion<T, L = LastOf<T>, N = [T] extends [never] ? true : false> =
  true extends N ? [] : Push<TuplifyUnion<Exclude<T, L>>, L>
type Full<T> = {
  [P in keyof T]-?: T[P];
}


// return useMemo(() => {
type FiltersByType = {
  [K in Filter["type"]]: Extract<Filter, { type: K }>["filter"]
}
type ActionsByType = {
  [K in Action["type"]]: Extract<Action, { type: K }>["args"]
}
type ConditionsByType = {
  [K in Condition["type"]]: Extract<Condition, { type: K }>
}


type EverythingByType = FiltersByType & ActionsByType & ConditionsByType

type FilterTypedObject<K extends keyof EverythingByType> = {
  [K2 in keyof EverythingByType[K]]-?:
  // EverythingByType[K][K2] extends CardHolderResolvable ? ["required", "variable", "filter:card", "filter:deck"] :
  // EverythingByType[K][K2] extends CardResolvable ? ["required", "variable", "filter:card"] :
  //   EverythingByType[K][K2] extends PlayerResolvable ? ["required", "variable", "filter:player"] :
  //     EverythingByType[K][K2] extends HandResolvable ? ["required", "variable", "filter:hand"] :
  //       EverythingByType[K][K2] extends DeckResolvable ? ["required", "variable", "filter:deck"] :

  // EverythingByType[K][K2] extends Resolvable ? ["required", "variable", EverythingByType[K][K2]] :
  EverythingByType[K][K2] extends Resolvable ? ["required", "variable", ...TuplifyUnion<Exclude<EverythingByType[K][K2], string | undefined>["type"]>] :
  // EverythingByType[K][K2] extends `$${string}` ? ["required", "variable"] :
  EverythingByType[K][K2] extends string ? ["required", "string"] | ["required", ...TuplifyUnion<`string:${Exclude<EverythingByType[K][K2], undefined>}`>] :
  EverythingByType[K][K2] extends Action[] ? ["required", "array", "action"] :
  EverythingByType[K][K2] extends number ? ["required", "number"] :
  EverythingByType[K][K2] extends number | string ? ["required", "number", "string"] :

  EverythingByType[K][K2] extends Condition[] ? ["required", "array", "condition"] :
  EverythingByType[K][K2] extends Condition ? ["required", "condition"] :
  EverythingByType[K][K2] extends boolean ? ["required", "boolean"] :

  EverythingByType[K][K2] extends boolean | string | number ? ["required", "string", "number", "boolean"] :

  EverythingByType[K][K2] extends Action[] | undefined ? ["array", "action"] :
  EverythingByType[K][K2] extends Filter | undefined ? TuplifyUnion<Exclude<EverythingByType[K][K2], undefined>["type"]> :
  EverythingByType[K][K2] extends Filter[] | undefined ? ["array", ...TuplifyUnion<Exclude<EverythingByType[K][K2], undefined>[number]["type"]>] :
  EverythingByType[K][K2] extends string[] | undefined ? ["array", "string"] :
  EverythingByType[K][K2] extends `$${string}` | undefined ? ["variable"] :
  EverythingByType[K][K2] extends string | undefined ? ["string"] | TuplifyUnion<`string:${Exclude<EverythingByType[K][K2], undefined>}`> :
  EverythingByType[K][K2] extends Resolvable | undefined ? ["variable", ...TuplifyUnion<Exclude<EverythingByType[K][K2], string | undefined>["type"]>] :
  EverythingByType[K][K2] extends number | undefined ? ["number"] :
  EverythingByType[K][K2] extends number | string | undefined ? ["number", "string"] :
  EverythingByType[K][K2] extends boolean | undefined ? ["boolean"] :

  EverythingByType[K][K2] extends Condition | undefined ? ["condition"] :
  EverythingByType[K][K2] extends Object | undefined ? {
    [K3 in keyof Exclude<EverythingByType[K][K2], undefined>]-?:
    Exclude<EverythingByType[K][K2], undefined>[K3] extends `$${string}` ? ["required", "variable"] :
    Exclude<EverythingByType[K][K2], undefined>[K3] extends string ? ["required", "string"] | ["required", ...TuplifyUnion<`string:${Exclude<Exclude<EverythingByType[K][K2], undefined>[K3], undefined>}`>] :

    Exclude<EverythingByType[K][K2], undefined>[K3] extends Action[] ? ["required", "array", "action"] :
    Exclude<EverythingByType[K][K2], undefined>[K3] extends number ? ["required", "number"] :
    Exclude<EverythingByType[K][K2], undefined>[K3] extends number | string ? ["required", "number", "string"] :

    Exclude<EverythingByType[K][K2], undefined>[K3] extends Condition[] ? ["required", "array", "condition"] :
    Exclude<EverythingByType[K][K2], undefined>[K3] extends Condition ? ["required", "condition"] :
    Exclude<EverythingByType[K][K2], undefined>[K3] extends boolean ? ["required", "boolean"] :

    Exclude<EverythingByType[K][K2], undefined>[K3] extends boolean | string | number ? ["required", "string", "number", "boolean"] :

    Exclude<EverythingByType[K][K2], undefined>[K3] extends Action[] | undefined ? ["array", "action"] :
    Exclude<EverythingByType[K][K2], undefined>[K3] extends Filter | undefined ? TuplifyUnion<Exclude<Exclude<EverythingByType[K][K2], undefined>[K3], undefined>["type"]> :
    Exclude<EverythingByType[K][K2], undefined>[K3] extends Filter[] | undefined ? ["array", ...TuplifyUnion<Exclude<Exclude<EverythingByType[K][K2], undefined>[K3], undefined>[number]["type"]>] :
    Exclude<EverythingByType[K][K2], undefined>[K3] extends string[] | undefined ? ["array", "string"] :
    Exclude<EverythingByType[K][K2], undefined>[K3] extends `$${string}` | undefined ? ["variable"] :
    Exclude<EverythingByType[K][K2], undefined>[K3] extends string | undefined ? ["string"] | TuplifyUnion<`string:${Exclude<Exclude<EverythingByType[K][K2], undefined>[K3], undefined>}`> :
    Exclude<EverythingByType[K][K2], undefined>[K3] extends Resolvable | undefined ? ["variable", ...TuplifyUnion<Exclude<Exclude<EverythingByType[K][K2], undefined>[K3], string | undefined>["type"]>] :
    Exclude<EverythingByType[K][K2], undefined>[K3] extends number | undefined ? ["number"] :
    Exclude<EverythingByType[K][K2], undefined>[K3] extends number | string | undefined ? ["number", "string"] :
    Exclude<EverythingByType[K][K2], undefined>[K3] extends boolean | undefined ? ["boolean"] :

    Exclude<EverythingByType[K][K2], undefined>[K3] extends Condition | undefined ? ["condition"] : unknown
    // EverythingByType[K][K2][K3] extends Object ? {
    //   [K4 in keyof EverythingByType[K][K2][K3]]-?:
    //   EverythingByType[K][K2][K3][K4] extends Filter ? TuplifyUnion<EverythingByType[K][K2][K3][K4]["type"]> :
    //   EverythingByType[K][K2][K3][K4] extends Filter[] ? ["array", ...TuplifyUnion<EverythingByType[K][K2][K3][K4][number]["type"]>] :
    //   EverythingByType[K][K2][K3][K4] extends string[] ? ["array", "string"] :
    //   EverythingByType[K][K2][K3][K4] extends `$${string}` ? ["variable"] :
    //   EverythingByType[K][K2][K3][K4] extends string ? TuplifyUnion<EverythingByType[K][K2][K3][K4]> :
    //   EverythingByType[K][K2][K3][K4] extends Resolvable ? ["variable", ...TuplifyUnion<Exclude<EverythingByType[K][K2][K3][K4], string>["type"]>] :
    //   EverythingByType[K][K2][K3][K4] extends number ? ["number"] :
    //   EverythingByType[K][K2][K3][K4] extends number | string ? ["number", "string"] :
    //   EverythingByType[K][K2][K3][K4] extends boolean ? ["boolean"] :
    //   EverythingByType[K][K2][K3][K4] extends Action[] ? ["array", "action"] :
    //   EverythingByType[K][K2][K3][K4] extends Condition ? ["condition"] :
    //   EverythingByType[K][K2][K3][K4] extends Condition[] ? ["array", "condition"] : "Is 3 layers of recursion still not enough for your needy ass?"

  } :
  never
  // EverythingByType[K][K2]
  // } : unknown
  // } : 'unknown'
}
// type FilterTypedObject<K extends keyof EverythingByType> = {
//   [K2 in keyof EverythingByType[K]]-?:
//   EverythingByType[K][K2] extends Object ? {
//     [K3 in keyof EverythingByType[K][K2]]-?:
//     EverythingByType[K][K2][K3]
//   } :
//   EverythingByType[K][K2]
// }



// type FilterTypedObject<K extends keyof EverythingByType> = {
//   [K2 in keyof EverythingByType[K]]-?:
//   EverythingByType[K][K2] }

export type FilterNodePropertiesVerifier = {
  [K in keyof EverythingByType]: FilterTypedObject<K>
}

// **DISCLAMER**: THIS IS THE BIGGEST FUCKING HACK. I'M SORRY.
// This is a hack to get around the fact that the type system doesn't allow for runtime shit.
// If you see an error make sure to do exactly what it says.
export let TypedNodeProperties: FilterNodePropertiesVerifier = {
  "filter:card": {
    $and: ["array", "filter:card"],
    $or: ["array", 'filter:card'],
    $not: ["filter:card"],
    has_all_of_tags: ["array", "string"],
    has_one_of_tags: ["array", "string"],
    has_tag: ["string"],
    inside: ["variable", "filter:deck", "filter:hand"],
    actions: ["array", "action"],
    iterator_parameter: ["variable"],
  },
  "filter:deck": {
    $and: ["array", "filter:deck"],
    $or: ["array", 'filter:deck'],
    $not: ["filter:deck"],
    has_all_of_tags: ["array", "string"],
    has_card: ['filter:card'],
    has_one_of_tags: ["array", "string"],
    has_tag: ['string'],
    has_x_of_cards: {
      amount: ["required", 'number'],
      cards: ['filter:card']
    },
    actions: ["array", "action"],
    iterator_parameter: ["variable"],
  },
  "filter:hand": {
    $and: ["array", "filter:hand"],
    $or: ["array", 'filter:hand'],
    $not: ["filter:hand"],
    has_all_of_tags: ["array", "string"],
    has_one_of_tags: ["array", "string"],
    from_player: ["variable", "filter:player"],
    has_tag: ['string'],
    has_x_of_cards: {
      amount: ["required", 'number'],
      cards: ['filter:card']
    },
    has_card: ['filter:card'],
    actions: ["array", "action"],
    iterator_parameter: ["variable"],
  },
  "filter:player": {
    $and: ["array", "filter:player"],
    $or: ["array", 'filter:player'],
    $not: ["filter:player"],
    has_all_of_tags: ["array", "string"],
    has_one_of_tags: ["array", "string"],
    has_tag: ['string'],
    has_hand: ['filter:hand'],
    actions: ["array", "action"],
    iterator_parameter: ["variable"],
  },
  "action:cards.move": {
    cards: ["required", "variable", "filter:card"],
    to: ["required", "variable", "filter:deck", "filter:hand"],
    where: ["string:top", "string:bottom", "string:random"]
  },
  "action:debug": {
    find: ["required", "variable", 'filter:card', "filter:deck", "filter:hand", "filter:player"]
  },
  "action:find.cards": {
    filter: ["required", "variable", "filter:card"]
  },
  "action:find.decks": {
    filter: ["required", "variable", "filter:deck"]
  },
  "action:find.hands": {
    filter: ["required", "variable", "filter:hand"]
  },
  "action:find.players": {
    filter: ["required", "variable", "filter:player"]
  },
  "action:logic.if": {
    condition: ["required", "condition"],
    false_actions: ["required", "array", "action"],
    true_actions: ["required", "array", "action"]
  },
  "action:logic.for_each": {
    actions: ["required", "array", "action"],
    as: ["required", "variable"],
    collection: ["required", "variable", "filter:card", "filter:deck", "filter:hand", "filter:player"],
  },
  "action:logic.loop": {
    actions: ["required", "array", "action"],
    loops: ["required", "number"]
  },
  "action:data.get": {
    key: ["required", "string"],
    object: ["required", "variable", "filter:card", "filter:deck", "filter:hand", "filter:player"]
  },
  "action:data.set": {
    key: ["required", "string"],
    object: ["required", "variable", "filter:card", "filter:deck", "filter:hand", "filter:player"],
    value: ["required", "string", "number", "boolean"]
  },
  "action:user_input.select_players": {
    from: ["variable", "filter:player"],
    max: ["required", 'number'],
    message: ["required", "string"],
    min: ["required", "number"],
    selector: ["required", "variable", "filter:player"]
  },
  "action:user_input.select_cards": {
    from: ["variable", "filter:card"],
    max: ["required", 'number'],
    message: ["required", "string"],
    min: ["required", "number"],
    selector: ["required", "variable", "filter:player"]
  },
  "condition:amount": {
    a: ["required", "variable"],
    b: ["required", "number", "string"],
    operator: ["required", "string:=", "string:>", "string:<"],
    type: ["required", "string"],
    not: ["boolean"]
  },
  "condition:array": {
    a: ["required", "variable"],
    b: ["required", "variable"],
    not: ["boolean"],
    operator: ["required", "string:contains"],
    type: ["required", "string"]
  },
  "condition:meta": {
    conditions: ["required", "array", "condition"],
    not: ["boolean"],
    operator: ["required", "string:and", "string:or"],
    type: ["required", "string"]
  },
  "condition:object": {
    a: ["required", "variable"],
    b: ["required", "variable"],
    not: ["boolean"],
    operator: ["required", "string:contains", "string:is"],
    type: ["required", "string"]
  },
  "condition:tags": {
    a: ["required", "variable"],
    b: ["required", "string"],
    not: ["boolean"],
    operator: ["required", "string:contains"],
    type: ["required", "string"]
  },
  "condition:type": {
    a: ["required", "variable"],
    b: ["required", "string"],
    not: ["boolean"],
    operator: ["required", "string:is_type", "string:contains_type"],
    type: ["required", "string"]
  },
  "action:logic.return": {
    value: ["required", "boolean"]
  },
  "action:logic.break": {},
  "action:deck.shuffle": {
    deck: ["required", "variable", "filter:deck"]
  },
  "action:deck.draw": {
    count: ["required", "number"],
    deck: ["required", "variable", "filter:deck"],
    to: ["required", "variable", "filter:deck", "filter:hand"]
  }

}






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
    selected?: `$${string}` | undefined;
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


