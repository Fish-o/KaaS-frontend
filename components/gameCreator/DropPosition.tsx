import { DraggableContext, DraggableScale, GrabbedObject, GrabbedObjectContext, ObjectIsGrabbedContext, SetDraggableContext } from "../gameCreator"
import styles from "../../styles/gameCreator.module.scss";
import { useContext, useEffect, useId, useMemo, useRef, useState } from "react";

type ValidElementTypes = GrabbedObject["data"]["type"] | "action"
export interface DropPositionObject {
  id: string,
  onDrop: (grabbedObject: GrabbedObject) => boolean,
  distance: number,
}

function checkDropPositionCompatibility(dropType: string | string[], objectType: string) {
  // console.log(dropType, objectType)
  if (dropType === objectType) return true;
  if (!Array.isArray(dropType) && objectType.startsWith(dropType)) return true;
  if (Array.isArray(dropType) && dropType.includes(objectType)) return true
  //Check each element of the array and see if it starts with dropType
  if (Array.isArray(dropType) && dropType.some((val) => objectType.startsWith(val))) {

    // console.log("returning true")
    return true
  };
  return false
}


function DropPositionObject(
  {
    children,
    active,
    disabledByDistance,
    dropDivRef,
    width,
    height,
    config: {
      overHeight = 100,
      overWidth = 100,
      activeStyle = {},
      inactiveStyle = {},
      type,
    }
  }: {
    children: React.ReactNode,
    active: boolean,
    disabledByDistance: boolean,
    dropDivRef: React.RefObject<HTMLDivElement>
    width: number,
    height: number,
    config: {
      overHeight?: number,
      overWidth?: number
      activeStyle?: React.CSSProperties,
      inactiveStyle?: React.CSSProperties
      type: T | T[]
    }
  }
) {
  return useMemo(() => {
    let style = styles.dropPosition
    if (disabledByDistance) style = styles.disabledDropPosition
    else if (active) style = styles.activeDropPosition



    if (!active && typeof children === "object") {
      return (
        <div ref={dropDivRef}>
          {children}
        </div>
      )
    }
    return (
      <div className={style}
        ref={dropDivRef}
        style={active ? { width: width ?? undefined, height: height ?? undefined, ...activeStyle } : { ...inactiveStyle }}>
        A
      </div>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    active,
    disabledByDistance,
    // activeStyle,
    // children

  ])

}

// TODO Refactor this to use A new Check Active Node and try to fix preformance icc
export default function DropPosition<T extends ValidElementTypes>(
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

  disable = useContext(ObjectIsGrabbedContext)

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
  let squaredDistance
  if (grabbedObject && grabbedData && currentBounds && !disable) {
    // console.log("[DropPosition]", grabbedObject, type)
    active =
      checkDropPositionCompatibility(type, grabbedData.type) &&
      // ((grabbedObject.clientX) < (currentBounds.x + (grabbedObject?.width ?? 100) + overWidth)) &&
      // ((grabbedObject.clientX + (grabbedObject?.width ?? 100)) > (currentBounds.x - overWidth)) &&
      // ((grabbedObject.clientY) < (currentBounds.y + window.scrollY + (grabbedObject?.height ?? 100) + overHeight)) &&
      // ((grabbedObject.clientY + (grabbedObject?.height ?? 100)) > (currentBounds.y + window.scrollY - overHeight))

      ((grabbedObject.clientX) < (currentBounds.x + 100)) &&
      ((grabbedObject.clientX + 100) > (currentBounds.x)) &&
      ((grabbedObject.clientY) < (currentBounds.y + window.scrollY + 100)) &&
      ((grabbedObject.clientY + 100) > (currentBounds.y + window.scrollY))

    squaredDistance =
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

  if (active) {
    Object.values(draggableContext.activeDropPoints).forEach(element => {
      if (element.distance < dropPosition.distance) {
        disabledByDistance = true
      }
    });
  }




  useEffect(() => {
    setDraggableContext?.((current) => {
      if (active && grabbedObject && currentBounds) {
        // @ts-ignore
        current.activeDropPoints[id] = dropPosition

      } else {
        delete current.activeDropPoints[id]
      }


      return (
        {
          ...current,
          activeDropPoints: { ...current.activeDropPoints }
        }
      )
    })
  }, [active, disabledByDistance])
  let width = (grabbedObject?.width ?? 100) * scale
  if (width > 100) width = 100
  let height = (grabbedObject?.height ?? 100) * scale
  if (height > 100) height = 100
  return (
    <DropPositionObject
      active={active}
      disabledByDistance={disabledByDistance}
      dropDivRef={ref}
      height={height}
      width={width}
      config={{
        overHeight,
        overWidth,
        activeStyle,
        inactiveStyle,
        type
      }}
    >
      {children}
    </DropPositionObject>

  )
  // //Make sure our drop position has the smallest distance to the grabbed object
  // return useMemo(() => {
  //   let style = styles.dropPosition
  //   if (disabledByDistance) style = styles.disabledDropPosition
  //   else if (active) style = styles.activeDropPosition


  //   return (
  //     <div className={style}
  //       ref={ref}
  //       style={active ? { width: width ?? undefined, height: height ?? undefined, ...activeStyle } : { ...inactiveStyle }}>
  //       A
  //     </div>
  //   )
  // }, [
  //   active,
  //   disabledByDistance,
  //   // activeStyle,
  //   // children

  // ])

}

export const IdleHoverChecker:
  React.FC<{
    onHoverExit: () => void,
    onHoverEnter: () => void,
    disable: boolean,
    children?: JSX.Element[] | JSX.Element
  }> = ({ onHoverExit, onHoverEnter, disable, children }) => {
    const grabbedObject = useContext(GrabbedObjectContext)
    const { data: grabbedData, } = grabbedObject || {}
    // const [position, setPosition] = useState({
    const ref = useRef<HTMLDivElement>(null);

    let active = false;
    const currentBounds = ref.current?.getBoundingClientRect()

    const [isHovered, setIsHovered] = useState(false)

    if (grabbedObject && grabbedData && currentBounds && !disable) {
      // console.log("[DropPosition]", grabbedObject, type)
      active =
        ((grabbedObject.clientX) < (currentBounds.x + 100)) &&
        ((grabbedObject.clientX + 100) > (currentBounds.x)) &&
        ((grabbedObject.clientY) < (currentBounds.y + window.scrollY + 100)) &&
        ((grabbedObject.clientY + 100) > (currentBounds.y + window.scrollY))


    }
    useEffect(() => {
      if (active) {
        if (!isHovered) {
          setIsHovered(true)
          onHoverEnter()
        }
      } else {
        if (isHovered) {
          setIsHovered(false)
          onHoverExit()
        }
      }

    }, [active, isHovered, onHoverEnter, onHoverExit])




    //Make sure our drop position has the smallest distance to the grabbed object

    return (
      <div
        ref={ref}
      >
        {children}
      </div>
    )
  }


