import { throttle } from "lodash";
import { useContext, useRef, useState, useMemo, useEffect } from "react";
import { DraggableContextRef, DraggableScale, GrabbedObject, HELDCONTAINEROFFSET, ObjectTypes, RefGrabbedObjectContext, SetDraggableContext, SetDraggableNodeObjects, SetGrabbedObjectContext } from "../gameCreator";
import { DropPositionObject } from "./DropPosition";
import styles from "../../styles/gameCreator.module.scss";
import React from "react";

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
    draggableObject: GrabbedObject
  } | {
    fillData: ObjectTypes
    draggableObject?: undefined
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
    // const setDraggableNodeObjects = useContext(SetDraggableNodeObjects)
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
      if (grabbedObjectRef?.current) return null





      //Deselect whatatever text is selected
      window.getSelection()?.removeAllRanges();
      const ctBounds = currentTarget.current?.getBoundingClientRect()
      if (!ctBounds) return
      draggableObject.clientX = ctBounds.left
      draggableObject.clientY = ctBounds.top
      draggableObject.width = ctBounds.width
      draggableObject.height = ctBounds.height
      if (!detached) {
        onGrab?.(draggableObject)
        setDraggableNodeObjects?.(current => ([...current, draggableObject]))

        return setGrabbedObject(draggableObject)
        // return draggableObject
      }

      setDraggableNodeObjects?.((current) => {
        //Make sure each of the z-index are below this one
        current.forEach((o) => {
          o.zindex = (o.zindex ?? 0) - 1
        })

        draggableObject.zindex = current.length
        return [...current]
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
      window.getSelection()?.removeAllRanges();

      if (pickupImmediate) {
        setDraggableNodeObjects?.((current) => {
          current.forEach((o) => {
            o.zindex = (o.zindex ?? 0) - 1
          })

          draggableObject.zindex = current.length
          return [...current]
        })
        setPickupImmediate(false)
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
    }
    const dragEnd = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      let selectedDropPoint: DropPositionObject | null = null;

      (Object.values(draggableContextRef?.current?.activeDropPoints ?? {}) as DropPositionObject[]).forEach(element => {
        if (selectedDropPoint === null || (element.distance < selectedDropPoint.distance)) {
          selectedDropPoint = element;
        }
      });

      if ((selectedDropPoint as unknown as DropPositionObject | null)?.onDrop(draggableObject)) {
        onDelete?.()
      }

      setHeld(false);
      if (detached) {
        const detachedBounding = draggableContextRef?.current?.detachedCanvasRef?.current?.getBoundingClientRect()
        if (!detachedBounding) return
        setPosition((current) => ({
          ...current,

          left: (e.pageX - diff.x - detachedBounding.left) / scale,
          top: (e.pageY - diff.y - detachedBounding.top) / scale
        }))
      }
      setGrabbedObject(null)
      setDraggableContext?.((current) => ({
        ...current, activeDropPoints: {}
      }))

    }
    const memoedChildren = useMemo(() => {
      return React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          //@ts-ignore
          return React.cloneElement(child, { rootHeld: held })
        }
      })
    }, [children, held])




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
          style={held ? {} : { left: position.left * scale, top: position.top * scale, pointerEvents: "none" }}
        >
          <div className={held ? styles.held : ""} style={held ? { ...position } : { pointerEvents: "none" }} >
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
// DraggableObject.whyDidYouRender = true
export default DraggableObject