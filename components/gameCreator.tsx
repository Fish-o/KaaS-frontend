import { useAutoAnimate } from '@formkit/auto-animate/react'
import NoSSR from 'react-no-ssr';
import { drop, isArray, throttle } from 'lodash';
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

const CANVASSIZE = 1000
const HELDCONTAINEROFFSET = 3000

import { Button, Input } from "@nextui-org/react";
import React, { LegacyRef, memo, useContext, useEffect, useId, useMemo, useRef } from "react";
import useState from 'react-usestateref'
import { Action, Resolvable, Variable } from "../lib/game/Actions";
import { CardFilterObject, DeckFilterObject, Filter, HandFilterObject, PlayerFilterObject, FilterObject } from "../lib/game/Filters";
import exampleGame from "../lib/games/example";
import styles from "../styles/gameCreator.module.scss";
import { EventObject } from "../lib/game/Events"
import { findIndex } from "lodash";
import { debug, time } from 'console';
import { Condition } from '../lib/game/Conditions';
import NoSSRProvider from './noSSRProvider';




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


type ObjectTypes = (Action | EventObject | Filter)
type GrabbedObject = GrabbedObjectBase & { data: ObjectTypes }

interface DropPosition {
  id: string,
  onDrop: (grabbedObject: GrabbedObject) => boolean,
  distance: number,
}


interface DraggableContextType {
  activeDropPoints: { [key: string]: DropPosition }
  detachedCanvasRef: React.RefObject<HTMLDivElement>
}



type NodeObjects = GrabbedObject[]



const ResolveNodeType: React.FC<{ objectData: ObjectTypes | string, held?: boolean, rootHeld?: boolean }> = memo(({ objectData, rootHeld = false, held = false }) => {
  held = held || rootHeld
  // return useMemo(() => {
  if (objectData.type.startsWith("action:")) {

    return <ActionNode action={objectData as Action} held={held} />
  }
  if (objectData.type.startsWith("event:")) {
    return <EventNode event={objectData as EventObject} held={held} />
  }
  // if (grabbedObject.type == 'returns') {
  //   return <VariableNode returns={grabbedObject.data} />
  // }
  if (objectData.type.startsWith('filter:')) {
    console.log("Resolving", objectData, objectData)
    return <FilterNode filter={objectData as Filter} held={held} />
  }
  if (typeof objectData === "string") {
    return (
      <Input
        value={objectData || typeof objectData}
        aria-label={"Argument input"}
      />
    )
  }
  return <p>
    Unknown Object {objectData.type}
  </p>
  // }, [grabbedObject, grabbedObject.data, grabbedObject.type])
})
ResolveNodeType.displayName = "ResolveNodeType"


const DraggableScale = React.createContext<number>(1);
const SetDraggableScale = React.createContext<React.Dispatch<React.SetStateAction<number>>>({});

//@ts-ignore
const DraggableContext = React.createContext<DraggableContextType>({});
const SetDraggableContext = React.createContext<React.Dispatch<React.SetStateAction<DraggableContextType>>>({});
const DraggableContextRef = React.createContext<React.RefObject<DraggableContextType>>();
//@ts-ignore
const DraggableNodeObjects = React.createContext<NodeObjects>([]);
const SetDraggableNodeObjects = React.createContext<React.Dispatch<React.SetStateAction<NodeObjects>>>({});

//@ts-ignore
const GrabbedObjectContext = React.createContext<GrabbedObject | null>(null);
const SetGrabbedObjectContext = React.createContext<React.Dispatch<React.SetStateAction<GrabbedObject | null>>>(() => { });
const RefGrabbedObjectContext = React.createContext<React.RefObject<GrabbedObject | null>>();

export const GameCreator: React.FC = () => {
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
    let seedData = [...exampleGame.events]

    return seedData.map((data) => {
      x += 100;
      y += 100
      return {
        pageX: x,
        pageY: y,
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

  const [grabNewObject, setGrabNewObject] = useState(false);

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
                          <Button onClick={() => {


                            let text = JSON.stringify(exampleGame, null, 2);
                            // //save the JSON file to the users computer
                            // var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
                            // saveAs(blob, "game.json");
                            const name = prompt("What is the name of this gamemode?")
                            if (name) {
                              const element = document.createElement("a");
                              const file = new Blob([text], { type: 'text/plain' });
                              element.href = URL.createObjectURL(file);
                              element.download = name + ".json";
                              document.body.appendChild(element); // Required for this to work in FireFox
                              element.click();
                            }



                          }}>Click to save gamemode</Button>
                          <Button onClick={() => {
                            setGrabNewObject(value => !value)
                          }}>Click to add a new node!</Button>
                          {grabNewObject ? <GrabNewObject setGrabNewObject={setGrabNewObject} /> : null}
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

export const EventDropPosition: React.FC<{ event: EventObject, id: string, i: number, setUpdater: React.Dispatch<React.SetStateAction<number>> }> = ({ event, id, i, setUpdater }) => {
  return <DropPosition key={`dp-${id}-${i}`}
    onDrop={(grabbedObject) => {
      const data = grabbedObject.data as Action
      // console.log("[Drop EVENT]", i)

      if (!grabbedObject.data.type.startsWith("action:")) return false;

      const foundIndex = event.actions.findIndex((action) => action == data)
      console.log("[Drop EVENT]", foundIndex, i)
      if (foundIndex === -1) {
        event.actions.splice(i + 1, 0, data);
        setUpdater(Date.now())
        return true
      }

      if (i == foundIndex) return false

      event.actions.splice(foundIndex, 1)
      if (i < foundIndex) {
        event.actions.splice(i + 1, 0, data);
      } else {
        event.actions.splice(i, 0, data);
      }
      setUpdater(Date.now())
      return true

    }}
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
      type: 'action'
    }} />
}

export const EventNode: React.FC<{ event: EventObject, held: boolean }> = ({ event, held = false }) => {
  // console.log("Rendering EventNode", event)
  const [animationParent] = useAutoAnimate()
  const [updater, setUpdater] = useState(Date.now())
  const id = useId();
  const nodeObjects = useContext(DraggableNodeObjects)
  const setNodeObjects = useContext(SetDraggableNodeObjects)
  useEffect(() => {
    console.log("Node Object Updated")
  }, [nodeObjects])

  // useEffect(() => {
  //   console.log("[EventNode]", event)

  // }, [])


  return useMemo(() => {
    // console.log("[EventNode Actually Updated]", event)
    return (
      <div className={styles.eventNode}>
        <h1>EVENT: {event.type}</h1>
        <button onClick={() => {
          event.actions.splice(0, 1);
          setUpdater(Date.now())
          console.log("[Delete EVENT]", event.actions)
        }}>
          Remove 0nd element
        </button>
        <button onClick={() => {
          setUpdater(Date.now())
          console.log("[Updaye EVENT]", Date.now())
        }}>
          Update
        </button>
        <EventDropPosition event={event} id={id} i={0} setUpdater={setUpdater} />
        {event.actions.map((a, i) => (
          // <div key={`tl-${id}-${Object.uniqueID(a)}`} style={{ border: "solid 2px black" }}>
          <div key={`${id}-${Object.uniqueID(a)}`}>

            <DraggableObject
              onGrab={(draggableObject) => {
                // return
                // console.log("[GRAB EVENT]", i)
                // console.log("onGrab", draggableObject)
                event.actions.splice(i, 1);
                setUpdater(current => current + 1)
              }}
              fillData={a}
            >
              <ActionNode action={a} key={`${id}-${Object.uniqueID(a)}`} />
            </DraggableObject>

            <EventDropPosition event={event} id={id} i={i} key={`dp_${id}-${Object.uniqueID(a)}`} setUpdater={setUpdater} />
          </div >
          // </div>
        ))
        }
      </div >)
  }, [event, updater, id, setNodeObjects])
}












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
                console.log("deleting");
                setNodeObjects((current) => {
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
    if (grabbedObjectRef.current) return null

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
    console.log("[Drag Start]", e.currentTarget.getBoundingClientRect())

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
    // console.log("[position]", position)

    setHeld(false);
  }
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();

    setScale(scale => {
      const delta = e.deltaY;
      const newScale = scale - (delta / 1000);
      if (newScale < 0.1) return scale
      if (newScale > 1) return scale

      // let newScale = .5
      // if (delta > 0) {
      //   newScale = .5
      // }
      // if (delta < 0) {
      //   newScale = 1
      // }
      let scaleDiffrence = newScale / scale
      let mouseXBeforeT = e.clientX - position.left;
      let mouseYBeforeT = e.clientY - position.top;

      // let mouseXBeforeT = 400;
      // let mouseYBeforeT = 200;

      let mouseXBefore = mouseXBeforeT / scale;
      let mouseYBefore = (mouseYBeforeT / scale)
      console.log("[Mouse]", mouseXBefore, mouseYBefore)
      let mouseXAfter = mouseXBeforeT / newScale
      let mouseYAfter = mouseYBeforeT / newScale
      console.log("[Mouse]", mouseXAfter, mouseYAfter)
      let diffX = (mouseXAfter - mouseXBefore) * newScale
      let diffY = (mouseYAfter - mouseYBefore) * newScale

      console.log("[Mouse]", diffX, diffY)

      setPosition((current) => ({
        ...current,
        left: current.left + diffX,
        top: current.top + diffY,
      }))
      // return scale



      let scaleChange = newScale / scale;
      console.log("[Scale Change]", scale, newScale, scaleChange)








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



const DraggableObject: React.FC<
  {
    children: JSX.Element,
    // data: GrabbedObject["data"],
    detached?: boolean,
    onGrab?:
    (draggableObject: GrabbedObject) => void,
    onDelete?: () => void,
    fillData?: undefined | ObjectTypes
  } & ({
    fillProps: undefined,
    draggableObject: GrabbedObject
  } | {
    fillData: ObjectTypes
    // draggableObject: undefined
  })> = ({
    children,
    // data = null,
    // type = null,
    detached,
    onGrab,
    onDelete,
    // @ts-ignore
    draggableObject: inputDraggableObject = undefined,
    fillData,
  }) => {
    let draggableObject = inputDraggableObject as GrabbedObject;
    if (fillData !== undefined) {
      draggableObject = {
        height: 0,
        clientX: 0,
        clientY: 0,
        width: 0,
        data: fillData,
        dontGrabImmediately: false,
      } as GrabbedObject;
    }



    const [held, setHeld] = useState(detached && !draggableObject.dontGrabImmediately)
    const [diff, setDiff] = useState({ x: 0, y: 0 })
    const [position, setPosition] = useState({ left: draggableObject.clientX, top: draggableObject.clientY })
    const draggableContextRef = useContext(DraggableContextRef)
    const setGrabbedObject = useContext(SetGrabbedObjectContext)
    const grabbedObjectRef = useContext(RefGrabbedObjectContext)
    const setDraggableContext = useContext(SetDraggableContext)
    const setDraggableNodeObjects = useContext(SetDraggableNodeObjects)
    const scale = useContext(DraggableScale)
    const [pickupImmediate, setPickupImmediate] = useState(detached && !draggableObject.dontGrabImmediately)

    const throttledSetGrabObject = useRef(throttle((draggableObject: GrabbedObject) => setGrabbedObject(
      (current) => {
        if (!current) return null
        return draggableObject
      }
    ), 0)
    )

    const currentTarget = useRef<HTMLDivElement>(null)

    const dragStart = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      // console.log("[dragStart]", grabbedObjectRef, draggableObject, detached)
      if (grabbedObjectRef.current) return null





      //Deselect whatatever text is selected
      // console.log("[dragStart]", e.clientX, e.clientY)
      window.getSelection()?.removeAllRanges();
      const ctBounds = currentTarget.current?.getBoundingClientRect()
      if (!ctBounds) return
      draggableObject.clientX = ctBounds.left
      draggableObject.clientY = ctBounds.top
      draggableObject.width = ctBounds.width
      draggableObject.height = ctBounds.height

      position
      if (!detached) {
        onGrab?.(draggableObject)
        setDraggableNodeObjects(current => ([...current, draggableObject]))

        return setGrabbedObject(draggableObject)
        // return draggableObject
      }

      setDraggableNodeObjects((current) => {
        //Make sure each of the z-index are below this one
        current.forEach((o) => {
          o.zindex = (o.zindex ?? 0) - 1
        })

        draggableObject.zindex = current.length
        return [...current]
      })
      console.log("[dragStart]", {
        left: ctBounds.left,
        top: ctBounds.top
      })
      setPosition((current) => ({
        ...current,
        left: ctBounds.left + HELDCONTAINEROFFSET,
        top: ctBounds.top + HELDCONTAINEROFFSET
      }))


      setDiff(
        {
          x: (e.clientX) - ctBounds.left,
          y: (e.clientY) - ctBounds.top
        }
      )

      setHeld(true);
      e.stopPropagation()

      return setGrabbedObject(draggableObject)



    }
    const dragging = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      // return;
      window.getSelection()?.removeAllRanges();

      if (pickupImmediate) {
        setDraggableNodeObjects((current) => {
          //Make sure each of the z-index are below this one
          current.forEach((o) => {
            o.zindex = (o.zindex ?? 0) - 1
          })

          draggableObject.zindex = current.length
          return [...current]
        })
        setPickupImmediate(false)
        // console.log("pickupImmediate")
        const clientX = draggableObject.clientX - window.scrollX
        const clientY = draggableObject.clientY - window.scrollY


        setDiff(
          {
            x: e.clientX - clientX,
            y: e.clientY - clientY
          }
        )
        diff.x = e.clientX - clientX
        diff.y = e.clientY - clientY
      }
      // return
      draggableObject.clientX = (e.clientX - diff.x);
      draggableObject.clientY = (e.clientY - diff.y);

      setPosition((current) => ({
        current,
        left: (e.clientX - diff.x) + HELDCONTAINEROFFSET,
        top: (e.clientY - diff.y) + HELDCONTAINEROFFSET,
      }))

      //Limit this function from being called to 5 times per second


      setGrabbedObject(
        (current) => {
          if (!current) return null
          return { ...draggableObject }
        }
      )
      // throttledSetGrabObject.current(
      //   {...draggableObject})
    }
    const dragEnd = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      // return
      // const ctBounds = e.currentTarget.getBoundingClientRect()
      // console.log("[Drop EVENT]", draggableContextRef.current.activeDropPoints)
      let selectedDropPoint: DropPosition | null = null;

      (Object.values(draggableContextRef.current.activeDropPoints) as DropPosition[]).forEach(element => {
        if (selectedDropPoint === null || (element.distance < selectedDropPoint.distance)) {
          selectedDropPoint = element;
        }
      });
      if (selectedDropPoint?.onDrop(draggableObject)) {
        console.log("[DELETING]")
        onDelete?.()
      }

      setHeld(false);
      // setDraggableContext((current) => ({...current, objectGrabbed: false, grabbedObject: null, activeDropPoints: [] }))
      if (detached) {
        const detachedBounding = draggableContextRef.current.detachedCanvasRef.current?.getBoundingClientRect()
        if (!detachedBounding) return
        setPosition((current) => ({
          ...current,

          left: (e.pageX - diff.x - detachedBounding.left) / scale,
          top: (e.pageY - diff.y - detachedBounding.top) / scale
        }))
      }
      setGrabbedObject(null)
      setDraggableContext((current) => ({
        ...current, activeDropPoints: {}
      }))

    }

    const memoedChildren = useMemo(() => {
      // if (draggableObject.type === "event") console.log("[memoedChildren]")
      return React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          //@ts-ignore
          return React.cloneElement(child, { rootHeld: held })
        }
      })
    }, [children, draggableObject.data.type])




    // const Wrapper = held ? HeldWrapper : DetachedWrapper

    // if (detached) {
    //   return (
    //     <Wrapper layout={{
    //       ...position,
    //       height: draggableObject.height, width: draggableObject.width
    //     }} onMouseMove={dragging} onMouseUp={dragEnd} onMouseDown={dragStart}>
    //       {memoedChildren}
    //     </Wrapper>
    //   )
    // }
    // // if (held) {
    // //   return (
    // //     <div className={styles.heldContainer} onMouseMoveCapture={(e) => dragging(e)} onMouseUpCapture={(e) => dragEnd(e)} >
    // //       <div className={styles.held} style={{ ...position, height: draggableObject.height, width: draggableObject.width }} >
    // //         {memoedChildren}
    // //       </div>
    // //     </div >
    // //   )
    // // // }
    //height: draggableObject.height ?? undefined, width: draggableObject.width ?? undefined 
    if (detached) {
      return (
        <div
          className={held ? styles.heldContainer : styles.detached}
          onMouseMoveCapture={(e) => { if (held) dragging(e) }}
          onMouseUpCapture={(e) => { if (held) dragEnd(e) }}
          style={held ? {} : { left: position.left * scale, top: position.top * scale, height: null, width: null, pointerEvents: "none" }}
        >
          <div className={held ? styles.held : ""} style={held ? { ...position, height: null, width: null } : { pointerEvents: "none" }} >
            <div className={held ? styles.heldBorder : styles.detachedBorder} style={{ transform: `scale(${scale})`, transformOrigin: "top left" }} ref={currentTarget}
              onMouseDown={(e) => { if (!held) dragStart(e) }}
            >
              {memoedChildren}
            </div>
          </div>
        </div >
      )
    }

    return (
      <div onMouseDown={(e) => dragStart(e)} ref={currentTarget}>
        {memoedChildren}
      </div>
    )
  }

type PartialRecord<K extends keyof any, T> = {
  [P in K]?: T;
};


function checkDropPositionCompatibility(dropType: string | string[], objectType: string) {
  if (dropType === objectType) return true;
  if (!Array.isArray(dropType) && objectType.startsWith(dropType)) return true;
  if (Array.isArray(dropType) && dropType.includes(objectType)) return true
  return false
}

type ValidElementTypes = GrabbedObject["data"]["type"] | "action"
function DropPosition<T extends ValidElementTypes>(
  {
    onDrop,
    children = undefined,
    disable = false,

    config: {
      overHeight = 100,
      overWidth = 100,
      activeStyle = {},
      inactiveStyle = {},
      type,
    } }
    :
    {
      onDrop: (grabbedObject: GrabbedObject & { type: T }) => boolean,
      children?: JSX.Element[] | JSX.Element,
      disable: boolean
      config: {
        overHeight?: number,
        overWidth?: number
        activeStyle?: React.CSSProperties,
        inactiveStyle?: React.CSSProperties
        type: T | T[]
      }
    }
) {
  const setDraggableContext = useContext(SetDraggableContext)
  const draggableContext = useContext(DraggableContext)
  const grabbedObject = useContext(GrabbedObjectContext)
  const scale = useContext(DraggableScale)
  const { data: grabbedData, } = grabbedObject || {}
  // const [position, setPosition] = useState({
  const ref = useRef<HTMLDivElement>(null);
  const id = useId()

  const dropPosition = useMemo(() => (
    {
      id,
      onDrop,
      distance: 10000,
    }
  ), [id, onDrop])
  let active = false;
  const currentBounds = ref.current?.getBoundingClientRect()

  if (grabbedObject && grabbedData && currentBounds && !disable) {
    // console.log("[DropPosition]", grabbedObject, type)
    active =
      checkDropPositionCompatibility(type, grabbedData.type) &&
      ((grabbedObject.clientX) < (currentBounds.x + (grabbedObject?.width ?? 100) + overWidth)) &&
      ((grabbedObject.clientX + (grabbedObject?.width ?? 100)) > (currentBounds.x - overWidth)) &&
      ((grabbedObject.clientY) < (currentBounds.y + window.scrollY + (grabbedObject?.height ?? 100) + overHeight)) &&
      ((grabbedObject.clientY + (grabbedObject?.height ?? 100)) > (currentBounds.y + window.scrollY - overHeight))
    // if (active) console.log("[DropPosition]", currentBounds, grabbedObject)

    let squaredDistance =
      (
        ((grabbedObject.clientX) + ((grabbedObject?.width ?? 100) / 2)) -
        (currentBounds.x + ((grabbedObject?.width ?? 100) / 2))
      ) ** 2
      +
      (
        ((grabbedObject.clientY) + ((grabbedObject?.height ?? 100) / 2)) -
        (currentBounds.y + ((grabbedObject?.height ?? 100) / 2))
      ) ** 2
    dropPosition.distance = squaredDistance
  }
  let disabledByDistance = false
  // X
  if (active) {
    // console.log("[DropPosition]", draggableContext.activeDropPoints, dropPosition);

    // let currentDistance = draggableContext.activeDropPoints[id]
    // if (currentDistance) {
    Object.values(draggableContext.activeDropPoints).forEach(element => {
      if (element.distance < dropPosition.distance) {
        disabledByDistance = true
      }
    });
    // }
    // else {
    //   active = false
    // }
  }

  //Make sure our drop position has the smallest distance to the grabbed object

  return useMemo(() => {

    setDraggableContext((current) => {
      if (active && grabbedObject && currentBounds) {
        // @ts-ignore
        current.activeDropPoints[id] = dropPosition

      } else {
        delete current.activeDropPoints[id]
      }

      // console.log("[SetDropPosition]", current.activeDropPoints, dropPosition, active);

      return (
        {
          ...current,
          activeDropPoints: { ...current.activeDropPoints }
        }
      )
    })

    // if (disabledByDistance) active = false;

    if (!active && typeof children === "object") {
      return (
        <div ref={ref}>
          {children}
        </div>
      )
    }
    let width = (grabbedObject?.width ?? 100) * scale
    if (width > 100) width = 100
    let height = (grabbedObject?.height ?? 100) * scale
    if (height > 100) height = 100
    return (
      <div className={
        disabledByDistance ? styles.disabledDropPosition :
          active ? styles.activeDropPosition :
            styles.dropPosition
      } ref={ref} style={active ? { width: width ?? undefined, height: height ?? undefined, ...activeStyle } : { ...inactiveStyle }} />
    )
  }, [active, disabledByDistance])

}


export const ActionNode: React.FC<{ action: Action, rootHeld?: boolean, held?: boolean }> = ({ action, rootHeld = false, held = false }) => {
  held = held || rootHeld
  console.log("[ActionNode]", action, held)
  const { type, args, returns } = getPrototype(action);
  const { name, description } = getActionInfo(type);
  const setDraggableNodeObjects = useContext(SetDraggableNodeObjects)
  const [, setUpdater] = useState(0)
  // const [draggableContext, setDraggableContext] = useContext(DraggableContext)

  return (
    <div className={styles.actionNode}>
      <div>
        <h1
          style={{
            textAlign: "center",
            padding: "0px",
            margin: "0px",
            marginTop: "10px",
          }}
        >
          {name}
        </h1>
        <p>{description}</p>
      </div>

      {/* <h4>Args:</h4> */}
      {/* {Object.uniqueID(action)} */}
      {Object.entries(args).map(([key, value], index) => {
        const entered: any = args[key as keyof typeof args];
        let filter: Filter | undefined = undefined;
        if (typeof entered === "object") {
          const enteredObj: Filter | Action[] = entered;
          if (Array.isArray(enteredObj)) {
          } else if (enteredObj.type.startsWith("filter:")) {
            filter = enteredObj;
          }
        }
        return <TypedArgument value={value} $key={key} object={args} type={action.type} held={held} setUpdater={setUpdater} key={key} />
      })
      }
      <h4>Variable:</h4>
      {

        Object.entries(action.returns ?? {}).map(([key, value], index) => {

          return (
            <div
              key={`node-arg-${key}-${index}`}
              className={styles.actionArgument}
            >


              <>
                <p>
                  <b>{key}</b>:{" "}
                </p>
                <Input
                  value={value || typeof value}
                  aria-label={"Argument input"}
                />
              </>
              {/* </p> */}
              <p></p>
            </div>
          );
        })
      }

    </div>
  )
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
  if (i) {
    return <>
      <DropPosition config={{ type: allowedDropTypes }} onDrop={(grabbedObject) => {
        if (i) {
          object[$key].splice(i, 0, grabbedObject)
          setUpdater(current => current + 1)
          return true;
        }
        return false
      }} disable={held} />
      <DraggableObject fillData={data} onGrab={(grabbedObject) => {
        if (i) {
          object[$key].splice(i, 1)
          setUpdater(current => current + 1)
        }
      }}>
        <ResolveNodeType objectData={data} held={held} />

      </DraggableObject>
    </>
  }
  return (<DraggableObject fillData={data} onGrab={(grabbedObject) => {
    object[$key] = undefined
  }}>
    <ResolveNodeType objectData={data} held={held} />

  </DraggableObject>)
  // return <p>null</p>
  // return (<DraggableObject fillData={GetValidDraggableObject(key)} onGrab={() => {
  //   setGrabNewObject(false)
  // }}>
  //   <ResolveNodeType objectData={GetValidDraggableObject(key)} />

  // </DraggableObject>)
}

type AcceptableTypes = "string" | "array" | GrabbedObject["data"]["type"]
const TypedArgument: React.FC<
  {
    $key: string,
    value: string | Filter | Filter[] | undefined,
    object: Action["args"] | Filter["filter"],
    type: ObjectTypes["type"],
    held: boolean,
    rootHeld?: boolean,
    setUpdater: React.Dispatch<React.SetStateAction<number>>
  }>
  = ({ $key: key, value, object, type, held = false, rootHeld = false, setUpdater }) => {
    held = held || rootHeld
    console.log("Rendered TypedArgument", key, object, type, held);
    const accetableTypes = TypedNodeProperties[type][key] as AcceptableTypes[] | { [key: string]: AcceptableTypes[] | { [key: string]: AcceptableTypes[] | { [key: string]: AcceptableTypes[] } } };
    let inputAllowed = false;
    let multipleAllowed = false;
    const grabbedObjectRef = useContext(RefGrabbedObjectContext)
    if (!Array.isArray(accetableTypes)) return <h1>TypedNodeProperties IS MISSING AN ENTRY FOR {type}</h1>;
    // if (Array.isArray(accetableTypes)) {
    if (accetableTypes.includes("string")) {
      inputAllowed = true;
    }
    if (accetableTypes.includes("array")) {
      multipleAllowed = true;
    }
    let actualTypes = accetableTypes.filter(value => value != "string" && value != "array") as unknown as ObjectTypes["type"]
    if (!object || !(key in object)) {
      return <h1>TypedNodeProperties IS MISSING AN ENTRY FOR KEY {key} in {type} {JSON.stringify(object)}</h1>;
    }
    value = object[key] as string | Filter | Filter[] | undefined;
    if (typeof value === "undefined") {
      return <h2>Undefined</h2>;
    }
    // }



    if (typeof value === "object" && multipleAllowed && !isArray(value)) {
      object[key] = [value]
      value = object[key] as string | Filter | Filter[] | undefined;
    }




    if (isArray(value) && value) {
      value
      return (
        <div className={styles.rowList}>
          <h3>{key}:</h3>

          <DropPosition config={{ type: actualTypes }} onDrop={(grabbedObject) => {
            console.log("Drop", value, grabbedObject);
            value!.splice(0, 0, grabbedObject.data);
            console.log("Drop", value, grabbedObject);

            setUpdater(current => current + 1)
            return true;
          }} disable={held} />

          {
            value.map((a, i) => (
              <ResolveGrabbedNode
                allowedDropTypes={actualTypes}
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

      )

    }








    if (typeof value === "object") {
      if (multipleAllowed) {
        return (
          <div className={styles.filterArgument}>
            <h3>{key}:</h3>
            <DraggableObject fillData={value} disable={held}
              onGrab={
                () => {
                  object[key] = undefined;
                  setUpdater(current => current + 1)
                }}>
              <FilterNode filter={value} held={held} />
            </DraggableObject>
            {
              multipleAllowed ? (
                <DropPosition config={{ type: actualTypes }} onDrop={(grabbedObject) => {
                  // if (grabbedObject.type !== "filter:cardHolder") return false;
                  console.log("dropped");
                  object[key] = grabbedObject.data;
                  setUpdater(current => current + 1)
                  return true;
                }} disable={held}>
                  <Input
                    value={value || typeof value}
                    aria-label={"Argument input"}
                  />
                </DropPosition>
              ) : null
            }
          </div >
        )
      }
      else {
        return (<div className={styles.filterArgument}>
          <h3>{key}:</h3>
          {/* @ts-ignore */}
          <DraggableObject fillData={value}
            onGrab={
              () => {
                console.log("Deleting key", key);
                object[key] = undefined;
                setUpdater(current => current + 1);

              }}>
            <>
              {/* {held} */}
              <FilterNode filter={value} held={held} />
            </>

          </DraggableObject>
        </div>)
      }
    }

    if (typeof value === "string") {
      return (
        <div className={styles.filterArgument}>
          <h3>{key}:</h3>
          <DropPosition config={{ type: actualTypes }} onDrop={(grabbedObject) => {
            object[key] = grabbedObject.data;
            setUpdater(current => current + 1)
            return true;
          }} disable={held} >

            <Input
              value={value || typeof value}
              aria-label={"Argument input"}
            />
          </DropPosition>

        </div>
      )
    }
    return typeof value




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
    //               console.log("dropped");
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

  }
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

type FiltersByType = {
  [K in Filter["type"]]: Full<Extract<Filter, { type: K }>["filter"]>
}
type ActionsByType = {
  [K in Action["type"]]: Full<Extract<Action, { type: K }>["args"]>
}

type EverythingByType = FiltersByType & ActionsByType

type FilterTypedObject<K extends keyof EverythingByType> = {
  [K2 in keyof EverythingByType[K]]-?:
  EverythingByType[K][K2] extends Filter ? TuplifyUnion<EverythingByType[K][K2]["type"]> :
  EverythingByType[K][K2] extends Filter[] ? ["array", ...TuplifyUnion<EverythingByType[K][K2][number]["type"]>] :
  EverythingByType[K][K2] extends string[] ? ["array", "string"] :
  EverythingByType[K][K2] extends string ? ["string"] :
  EverythingByType[K][K2] extends Resolvable ? ["string", ...TuplifyUnion<Exclude<EverythingByType[K][K2], string>["type"]>] :
  EverythingByType[K][K2] extends number ? ["number"] :
  EverythingByType[K][K2] extends Action[] ? ["array", "action"] :
  EverythingByType[K][K2] extends Condition ? ["condition"] :
  EverythingByType[K][K2] extends Object ? {
    [K3 in keyof EverythingByType[K][K2]]-?:
    EverythingByType[K][K2][K3] extends Filter ? TuplifyUnion<EverythingByType[K][K2][K3]["type"]> :
    EverythingByType[K][K2][K3] extends Filter[] ? ["array", ...TuplifyUnion<EverythingByType[K][K2][K3][number]["type"]>] :
    EverythingByType[K][K2][K3] extends string[] ? ["array", "string"] :
    EverythingByType[K][K2][K3] extends string ? ["string"] :
    EverythingByType[K][K2][K3] extends number ? ["number"] :
    EverythingByType[K][K2][K3] extends Action[] ? ["array", "action"] :
    EverythingByType[K][K2][K3] extends Condition ? ["condition"] :
    EverythingByType[K][K2][K3] extends Resolvable ? ["string", ...TuplifyUnion<Exclude<EverythingByType[K][K2][K3], string>["type"]>] :
    EverythingByType[K][K2][K3] extends Object ? {
      [K4 in keyof EverythingByType[K][K2][K3]]-?:
      EverythingByType[K][K2][K3][K4] extends Filter ? TuplifyUnion<EverythingByType[K][K2][K3][K4]["type"]> :
      EverythingByType[K][K2][K3][K4] extends Filter[] ? ["array", ...TuplifyUnion<EverythingByType[K][K2][K3][K4][number]["type"]>] :
      EverythingByType[K][K2][K3][K4] extends string[] ? ["array", "string"] :
      EverythingByType[K][K2][K3][K4] extends string ? ["string"] :
      EverythingByType[K][K2][K3][K4] extends number ? ["number"] :
      EverythingByType[K][K2][K3][K4] extends Action[] ? ["array", "action"] :
      EverythingByType[K][K2][K3][K4] extends Condition ? ["condition"] :

      EverythingByType[K][K2][K3][K4] extends Resolvable ? ["string", ...TuplifyUnion<Exclude<EverythingByType[K][K2][K3][K4], string>["type"]>] : "Is 3 layers of recursion still not enough for your needy ass?"
    } : never
  } : never
}
// type FilterTypedObject<K extends keyof EverythingByType> = {
//   [K2 in keyof EverythingByType[K]]-?:
//   EverythingByType[K][K2] }
type FilterNodePropertiesVerifier = {
  [K in keyof EverythingByType]: FilterTypedObject<K>
}



// **DISCLAMER**: THIS IS THE BIGGEST FUCKING HACK. I'M SORRY.
// This is a hack to get around the fact that the type system doesn't allow for runtime shit.
// If you see an error make sure to do exactly what it says.
let TypedNodeProperties: FilterNodePropertiesVerifier = {
  "filter:card": {
    $and: ["array", "filter:card"],
    $or: ["array", 'filter:card'],
    $not: ["filter:card"],
    has_all_of_tags: ["array", "string"],
    has_one_of_tags: ["array", "string"],
    has_tag: ['string'],
    inside: ["string", "filter:deck", "filter:hand"]
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
      amount: ['number'],
      cards: ['filter:card']
    },
  },
  "filter:hand": {
    $and: ["array", "filter:hand"],
    $or: ["array", 'filter:hand'],
    $not: ["filter:hand"],
    has_all_of_tags: ["array", "string"],
    has_one_of_tags: ["array", "string"],
    from_player: ["string", "filter:player"],
    has_tag: ['string'],
    has_x_of_cards: {
      amount: ['number'],
      cards: ['filter:card']
    },
    has_card: ['filter:card'],
  },
  "filter:player": {
    $and: ["array", "filter:player"],
    $or: ["array", 'filter:player'],
    $not: ["filter:player"],
    has_all_of_tags: ["array", "string"],
    has_one_of_tags: ["array", "string"],
    has_tag: ['string'],
    has_hand: ['filter:hand'],
  },
  "action:cards.move": {
    cards: ["string", "filter:card"],
    to: ["string", "filter:deck", "filter:hand"],
    where: ["string"]
  },
  "action:debug": {
    find: ["string", 'filter:card', "filter:deck", "filter:hand", "filter:player"]
  },
  "action:find.cards": {
    filter: ["filter:card"]
  },
  "action:find.decks": {
    filter: ["filter:deck"]
  },
  "action:find.hands": {
    filter: ["filter:hand"]
  },
  "action:find.players": {
    filter: ["filter:player"]
  },
  "action:logic.if": {
    condition: ["condition"],
    false_actions: ["array", "action"],
    true_actions: ["array", "action"]
  },
  "action:logic.for_each": {
    actions: ["array", "action"],
    as: ["string"],
    collection: ["string", "filter:card", "filter:deck", "filter:hand", "filter:player"],
  },
  "action:user_input.select_players": {
    from: ["string", "filter:player"],
    max: ['number'],
    message: ["string"],
    min: ["number"],
    selector: ["string", "filter:player"]
  }
}





export const FilterNode: React.FC<{ filter: Filter, rootHeld?: boolean, held?: boolean }> = ({ filter, rootHeld = false, held = false }) => {
  // console.log(filter)
  // filter.filter.$and
  // switch (filter.type) {
  //   case "filter:card":
  //     filter.filter.$and
  held = rootHeld || held
  const [updater, setUpdater] = useState(0);

  const grabbedObject = useContext(GrabbedObjectContext);
  useEffect(() => {
    console.log("Updating")
  }, [updater])

  return (useMemo(() => {
    if (grabbedObject && !held) {
      Object.entries(TypedNodeProperties[filter.type]).forEach(([key,]) => {
        //@ts-ignore
        let possibleTypes = TypedNodeProperties[filter.type][key] as string[];

        if (Array.isArray(possibleTypes)) {
          if (possibleTypes.includes(grabbedObject.data.type)) {
            //@ts-ignore
            console.log(filter)
            if (!filter.filter[key]) {
              //@ts-ignore
              filter.filter[key] = "<Placeholder>"
            }
          }
        }
      })
    }
    else {
      Object.entries(filter.filter).forEach(([key, value]) => {
        if (value === "<Placeholder>") {
          //@ts-ignore
          delete filter.filter[key]
        }
      })
    }

    return (
      <div className={styles.filterNode} >
        <h2>{filter.type}</h2>
        {Object.entries(filter.filter).map(([key, value]) => {
          return (<TypedArgument key={key} $key={key} value={value} object={filter.filter} type={filter.type} held={held} setUpdater={setUpdater} />)
        })}
      </div >
    )
  }, [grabbedObject?.data?.type, filter, held]))

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

function GetValidDraggableObject(type: keyof FilterNodePropertiesVerifier): ObjectTypes {
  if (type.startsWith("filter:")) {
    return {
      type: type,
      filter: {

      }
    } as Filter
  }
  if (type.startsWith("action:")) {
    return {
      args: {},
      type: type as Action["type"]

    } as Action
  }
  return {
    type: type as EventObject["type"],
  } as EventObject
}

const GrabNewObject: React.FC<{ setGrabNewObject: (arg0: boolean) => {} }> = ({ setGrabNewObject }) => {
  return (

    <div className={styles.pickNewNode}>

      {
        Object.entries(TypedNodeProperties).map(([key, value]: [keyof FilterNodePropertiesVerifier, any]) => {

          return (
            <div key={key}>
              <DraggableObject fillData={GetValidDraggableObject(key)} onGrab={() => {
                setGrabNewObject(false)
              }}>
                <ResolveNodeType objectData={GetValidDraggableObject(key)} />

              </DraggableObject>
            </div>
          )


        })

      }
    </div >
  )


}


function getActionInfo(type: Action["type"]): {
  name: string;
  description: string;
} {
  switch (type) {
    case "action:cards.move":
      return {
        name: "Move cards",
        description: "Move cards from one card holder to another",
      };
    case "action:logic.for_each":
      return {
        name: "For each",
        description: "Run a set of actions for each item that it found",
      };
    case "action:logic.if":
      return {
        name: "If",
        description: "Run a set of actions if the condition is true",
      };
    case "action:find.cards":
      return {
        name: "Find cards",
        description: "Find cards in the game",
      };
    case "action:find.decks":
      return {
        name: "Find decks",
        description: "Find decks in the game",
      };
    case "action:find.players":
      return {
        name: "Find players",
        description: "Find players in the game",
      };
    case "action:find.hands":
      return {
        name: "Find hands",
        description: "Find hands of players in the game",
      };
    case "action:debug":
      return {
        name: "Debug",
        description: "Debug",
      };
    case "action:user_input.select_players":
      return {
        name: "Select players",
        description: "Prompt a user to select players",
      };
    default: const grabbedObject = useContext(GrabbedObjectContext);

      return {
        // @ts-ignore
        name: type,
        description: "{description}",
      };
  }
}