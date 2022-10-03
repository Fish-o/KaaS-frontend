import { DraggableContext, DraggableScale, GrabbedObject, GrabbedObjectContext, SetDraggableContext } from "../gameCreator"
import styles from "../../styles/gameCreator.module.scss";
import { useContext, useId, useMemo, useRef, useState } from "react";

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
      // ((grabbedObject.clientX) < (currentBounds.x + (grabbedObject?.width ?? 100) + overWidth)) &&
      // ((grabbedObject.clientX + (grabbedObject?.width ?? 100)) > (currentBounds.x - overWidth)) &&
      // ((grabbedObject.clientY) < (currentBounds.y + window.scrollY + (grabbedObject?.height ?? 100) + overHeight)) &&
      // ((grabbedObject.clientY + (grabbedObject?.height ?? 100)) > (currentBounds.y + window.scrollY - overHeight))

      ((grabbedObject.clientX) < (currentBounds.x + 100)) &&
      ((grabbedObject.clientX + 100) > (currentBounds.x)) &&
      ((grabbedObject.clientY) < (currentBounds.y + window.scrollY + 100)) &&
      ((grabbedObject.clientY + 100) > (currentBounds.y + window.scrollY))
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

    setDraggableContext?.((current) => {
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
export const IdleHoverChecker:
  React.FC<{
    onHoverExit: () => void,
    onHoverEnter: () => void,
    disable: boolean,
    children?: JSX.Element[] | JSX.Element
  }> = ({ onHoverExit, onHoverEnter, disable, children }) => {
    const setDraggableContext = useContext(SetDraggableContext)
    const draggableContext = useContext(DraggableContext)
    const grabbedObject = useContext(GrabbedObjectContext)
    const scale = useContext(DraggableScale)
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

    }
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


    //Make sure our drop position has the smallest distance to the grabbed object

    return (
      <div
        ref={ref}
      >
        {children}
      </div>
    )
  }


