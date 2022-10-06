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
import { MethodObject } from '../lib/game/Method';




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


export type ObjectTypes = (Action | EventObject | Filter | Condition | MethodObject)
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




export const ObjectIsGrabbedContext = React.createContext<boolean>(false);


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

type ActionReturnsByType = {
  [K in Action["type"]]: Exclude<Extract<Action, { type: K }>["returns"], undefined>
}


type EverythingByType = FiltersByType & ActionsByType & ConditionsByType


// **DISCLAMER**: THIS IS THE BIGGEST FUCKING HACK. I'M SORRY.
// This is a hack to get around the fact that the type system doesn't allow for runtime shit.
// If you see an error make sure to do exactly what it says.
type FilterTypedObject<K extends keyof BT, BT> = {
  [K2 in keyof BT[K]]-?:
  // EverythingByType[K][K2] extends CardHolderResolvable ? ["required", "variable", "filter:card", "filter:deck"] :
  // EverythingByType[K][K2] extends CardResolvable ? ["required", "variable", "filter:card"] :
  //   EverythingByType[K][K2] extends PlayerResolvable ? ["required", "variable", "filter:player"] :
  //     EverythingByType[K][K2] extends HandResolvable ? ["required", "variable", "filter:hand"] :
  //       EverythingByType[K][K2] extends DeckResolvable ? ["required", "variable", "filter:deck"] :

  // EverythingByType[K][K2] extends Resolvable ? ["required", "variable", EverythingByType[K][K2]] :

  // BT[K][K2] extends Resolvable | string ? ["required", "variable", "string"] :
  BT[K][K2] extends Resolvable ? ["required", "variable", ...TuplifyUnion<Exclude<BT[K][K2], string | undefined>["type"]>] :




  // EverythingByType[K][K2] extends `$${string}` ? ["required", "variable"] :
  BT[K][K2] extends string ? ["required", "string"] | ["required", ...TuplifyUnion<`string:${Exclude<BT[K][K2], undefined>}`>] :
  BT[K][K2] extends Action[] ? ["required", "array", "action"] :
  BT[K][K2] extends number ? ["required", "number"] :
  BT[K][K2] extends number | Variable ? ["required", "number", "variable"] :
  BT[K][K2] extends number | string ? ["required", "number", "string"] :

  BT[K][K2] extends Condition[] ? ["required", "array", "condition"] :
  BT[K][K2] extends Condition ? ["required", "condition"] :
  BT[K][K2] extends boolean ? ["required", "boolean"] :

  BT[K][K2] extends boolean | string | number ? ["required", "string", "number", "boolean"] :

  BT[K][K2] extends Action[] | undefined ? ["array", "action"] :
  BT[K][K2] extends Filter | undefined ? TuplifyUnion<Exclude<BT[K][K2], undefined>["type"]> :
  BT[K][K2] extends Filter[] | undefined ? ["array", ...TuplifyUnion<Exclude<BT[K][K2], undefined>[number]["type"]>] :
  BT[K][K2] extends string[] | undefined ? ["array", "string"] :
  BT[K][K2] extends `$${string}` | undefined ? ["variable"] :
  BT[K][K2] extends string | undefined ? ["string"] | TuplifyUnion<`string:${Exclude<BT[K][K2], undefined>}`> :
  BT[K][K2] extends Resolvable | undefined ? ["variable", ...TuplifyUnion<Exclude<BT[K][K2], string | undefined>["type"]>] :
  BT[K][K2] extends number | undefined ? ["number"] :
  BT[K][K2] extends number | string | undefined ? ["number", "string"] :
  BT[K][K2] extends boolean | undefined ? ["boolean"] :

  BT[K][K2] extends Condition | undefined ? ["condition"] :
  BT[K][K2] extends Object | undefined ? {
    [K3 in keyof Exclude<BT[K][K2], undefined>]-?:
    Exclude<BT[K][K2], undefined>[K3] extends `$${string}` ? ["required", "variable"] :
    Exclude<BT[K][K2], undefined>[K3] extends string ? ["required", "string"] | ["required", ...TuplifyUnion<`string:${Exclude<Exclude<BT[K][K2], undefined>[K3], undefined>}`>] :

    Exclude<BT[K][K2], undefined>[K3] extends Action[] ? ["required", "array", "action"] :
    Exclude<BT[K][K2], undefined>[K3] extends number ? ["required", "number"] :
    Exclude<BT[K][K2], undefined>[K3] extends number | string ? ["required", "number", "string"] :

    Exclude<BT[K][K2], undefined>[K3] extends Condition[] ? ["required", "array", "condition"] :
    Exclude<BT[K][K2], undefined>[K3] extends Condition ? ["required", "condition"] :
    Exclude<BT[K][K2], undefined>[K3] extends boolean ? ["required", "boolean"] :

    Exclude<BT[K][K2], undefined>[K3] extends boolean | string | number ? ["required", "string", "number", "boolean"] :

    Exclude<BT[K][K2], undefined>[K3] extends Action[] | undefined ? ["array", "action"] :
    Exclude<BT[K][K2], undefined>[K3] extends Filter | undefined ? TuplifyUnion<Exclude<Exclude<BT[K][K2], undefined>[K3], undefined>["type"]> :
    Exclude<BT[K][K2], undefined>[K3] extends Filter[] | undefined ? ["array", ...TuplifyUnion<Exclude<Exclude<BT[K][K2], undefined>[K3], undefined>[number]["type"]>] :
    Exclude<BT[K][K2], undefined>[K3] extends string[] | undefined ? ["array", "string"] :
    Exclude<BT[K][K2], undefined>[K3] extends `$${string}` | undefined ? ["variable"] :
    Exclude<BT[K][K2], undefined>[K3] extends string | undefined ? ["string"] | TuplifyUnion<`string:${Exclude<Exclude<BT[K][K2], undefined>[K3], undefined>}`> :
    Exclude<BT[K][K2], undefined>[K3] extends Resolvable | undefined ? ["variable", ...TuplifyUnion<Exclude<Exclude<BT[K][K2], undefined>[K3], string | undefined>["type"]>] :
    Exclude<BT[K][K2], undefined>[K3] extends number | undefined ? ["number"] :
    Exclude<BT[K][K2], undefined>[K3] extends number | string | undefined ? ["number", "string"] :
    Exclude<BT[K][K2], undefined>[K3] extends boolean | undefined ? ["boolean"] :

    Exclude<BT[K][K2], undefined>[K3] extends Condition | undefined ? ["condition"] : unknown
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

export let TypedNodeProperties: {
  [K in keyof EverythingByType]: FilterTypedObject<K, EverythingByType>
} = {
  "filter:card": {
    $and: ["array", "filter:card"],
    $or: ["array", 'filter:card'],
    $not: ["filter:card"],
    has_all_of_tags: ["array", "string"],
    has_one_of_tags: ["array", "string"],
    has_tag: ["string"],
    inside: ["variable", "filter:deck", "filter:hand"],
    iterator: {
      actions: ["array", "action"],
      parameter: ["variable"],
      condition: ["condition"],
    },
    has_property: {
      property: ['required', "string"],
      value: ['required', "string"]
    }
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

    iterator: {
      actions: ["array", "action"],
      parameter: ["variable"],
      condition: ["condition"],
    },

    has_property: {
      property: ['required', "string"],
      value: ['required', "string"]
    }
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
    iterator: {
      actions: ["array", "action"],
      parameter: ["variable"],
      condition: ["condition"],
    },

    has_property: {
      property: ['required', "string"],
      value: ['required', "string"]
    }
  },
  "filter:player": {
    $and: ["array", "filter:player"],
    $or: ["array", 'filter:player'],
    $not: ["filter:player"],
    has_all_of_tags: ["array", "string"],
    has_one_of_tags: ["array", "string"],
    has_tag: ['string'],
    has_hand: ['filter:hand'],
    iterator: {
      actions: ["array", "action"],
      parameter: ["variable"],
      condition: ["condition"],
    },

    has_property: {
      property: ['required', "string"],
      value: ['required', "string"]
    }
  },
  "action:cards.move": {
    cards: ["required", "variable", "filter:card"],
    to: ["required", "variable", "filter:deck", "filter:hand"],
    where: ["string:top", "string:bottom", "string:random"],
  },
  "action:debug": {
    find: ["required", "variable", 'filter:card', "filter:deck", "filter:hand", "filter:player"],
  },
  "action:find.cards": {
    filter: ["required", "variable", "filter:card"],
  },
  "action:find.decks": {
    filter: ["required", "variable", "filter:deck"],
  },
  "action:find.hands": {
    filter: ["required", "variable", "filter:hand"],
  },
  "action:find.players": {
    filter: ["required", "variable", "filter:player"],
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
    object: ["required", "variable", "filter:card", "filter:deck", "filter:hand", "filter:player"],
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
    b: ["required", 'number', "variable"],
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
  "condition:data.single": {
    type: ["required", "string"],
    a: ["required", "variable"],
    b: ["required", "string"],
    key: ["required", "string"],
    not: ["boolean"],
    operator: ["required", "string:contains", "string:=", "string:>", "string:<", "string:!=", "string:starts_with", "string:ends_with"]
  },
  "condition:data.compare": {
    type: ["required", "string"],
    a: ["required", "variable"],
    b: ["required", "variable"],
    key: ["required", "string"],
    not: ["boolean"],
    operator: ["required", "string:contains", "string:=", "string:>", "string:<", "string:!=", "string:starts_with", "string:ends_with"]
  },


  "action:logic.return": {
    value: ["required", "boolean"]
  },
  "action:logic.break": {},

  "action:logic.method": {
    methodName: ["required", 'string']
  },


  "action:deck.shuffle": {
    deck: ["required", "variable", "filter:deck"]
  },
  "action:deck.draw": {
    count: ["required", "number"],
    deck: ["required", "variable", "filter:deck"],
    to: ["required", "variable", "filter:deck", "filter:hand"]
  }

}
// export let DescriptionForAllTheTypes:
//   {
//     [key in keyof EverythingByType[keyof EverythingByType]]: string
//   } =
//   deck:

// }



export let TypedActionReturns: {
  [K in keyof ActionReturnsByType]: FilterTypedObject<K, ActionReturnsByType>
} = {
  "action:cards.move": {
    destination: ["variable"],
    moved_cards: ["variable"],
  },
  "action:data.get": {
    value: ["required", "variable"]
  },
  "action:data.set": {

  },
  "action:debug": {},
  "action:deck.draw": {
    deck: ["variable"],
  },
  "action:deck.shuffle": {
    deck: ["variable"]
  },
  "action:find.cards": {
    found_many: ["variable"],
    found_one: ["variable"],
  },
  "action:find.decks": {
    found_many: ["variable"],
    found_one: ["variable"],
  },
  "action:find.hands": {
    found_many: ["variable"],
    found_one: ["variable"],
  },
  "action:find.players": {
    found_many: ["variable"],
    found_one: ["variable"],
  },
  "action:logic.break": {
  },
  "action:logic.for_each": {},
  "action:logic.if": {},
  "action:logic.loop": {},
  "action:logic.return": {},
  "action:logic.method": {},
  "action:user_input.select_cards": {
    selected: ["required", "variable"]
  },
  "action:user_input.select_players": {
    selected: ["variable"]
  },
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


