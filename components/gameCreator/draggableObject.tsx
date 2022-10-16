import { throttle } from "lodash";
import { useContext, useRef, useState, useMemo, useEffect } from "react";
import {
  CurrentMousePositionRef,
  DraggableContextRef,
  DraggableScale,
  GrabbedObject,
  HELDCONTAINEROFFSET,
  ObjectIsGrabbedContext,
  ObjectTypes,
  RefGrabbedObjectContext,
  SetDraggableContext,
  SetDraggableNodeObjects,
  SetGrabbedObjectContext,
} from "../gameCreator";
import { DropPositionObject } from "./DropPosition";
import styles from "../../styles/gameCreator.module.scss";
import React from "react";

const DraggableObject: React.FC<
  {
    children: JSX.Element;
    // data: GrabbedObject["data"],
    detached?: boolean;
    onGrab?: (draggableObject: GrabbedObject) => void;
    onDelete?: () => void;
    fillData?: ObjectTypes;
  } & (
    | {
        draggableObject: GrabbedObject;
      }
    | {
        fillData: ObjectTypes;
        draggableObject?: undefined;
      }
  )
> = ({
  children,
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

  const currentMousePositionRef = useContext(CurrentMousePositionRef);

  const [pickupImmediate, setPickupImmediate] = useState(
    detached && !draggableObject.dontGrabImmediately
  );

  const [held, setHeld] = useState(
    detached && !draggableObject.dontGrabImmediately
  );
  const [diff, setDiff] = useState(() => {
    if (pickupImmediate && currentMousePositionRef?.current) {
      const clientX = currentMousePositionRef.current.x - window.scrollX;
      const clientY = currentMousePositionRef.current.y - window.scrollY;

      return {
        x: clientX - draggableObject.clientX,
        y: clientY - draggableObject.clientY,
      };
    }
    return { x: 0, y: 0 };
  });
  const [position, setPosition] = useState(() => {
    if (pickupImmediate) {
      return {
        left: draggableObject.clientX + HELDCONTAINEROFFSET,
        top: draggableObject.clientY + HELDCONTAINEROFFSET,
      };
    } else {
      return {
        left: draggableObject.clientX,
        top: draggableObject.clientY,
      };
    }
  });

  const draggableContextRef = useContext(DraggableContextRef);
  const setGrabbedObject = useContext(SetGrabbedObjectContext);
  const grabbedObjectRef = useContext(RefGrabbedObjectContext);
  const setDraggableContext = useContext(SetDraggableContext);
  const setDraggableNodeObjects = useContext(SetDraggableNodeObjects);
  const scale = useContext(DraggableScale);

  const throttledSetGrabObject = useRef(
    throttle(
      (draggableObject: GrabbedObject) =>
        setGrabbedObject((current) => {
          if (!current) return null;
          return draggableObject;
        }),
      200
    )
  );

  const currentTarget = useRef<HTMLDivElement>(null);

  const dragStart = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (grabbedObjectRef?.current) return null;

    //Deselect whatatever text is selected
    window.getSelection()?.removeAllRanges();
    const ctBounds = currentTarget.current?.getBoundingClientRect();
    if (!ctBounds) return;
    draggableObject.clientX = ctBounds.left;
    draggableObject.clientY = ctBounds.top;
    draggableObject.width = ctBounds.width;
    draggableObject.height = ctBounds.height;
    if (!detached) {
      onGrab?.(draggableObject);
      setDraggableNodeObjects?.((current) => [...current, draggableObject]);

      return setGrabbedObject(draggableObject);
      // return draggableObject
    }

    setDraggableNodeObjects?.((current) => {
      //Make sure each of the z-index are below this one
      current.forEach((o) => {
        o.zindex = (o.zindex ?? 0) - 1;
      });

      draggableObject.zindex = current.length;
      return [...current];
    });
    setPosition((current) => ({
      ...current,
      left: ctBounds.left + HELDCONTAINEROFFSET,
      top: ctBounds.top + HELDCONTAINEROFFSET,
    }));

    setDiff({
      x: e.clientX - ctBounds.left,
      y: e.clientY - ctBounds.top,
    });

    setHeld(true);
    e.stopPropagation();

    return setGrabbedObject(draggableObject);
  };
  const dragging = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    console.log("dragging");
    window.getSelection()?.removeAllRanges();

    draggableObject.clientX = e.clientX - diff.x;
    draggableObject.clientY = e.clientY - diff.y;

    setPosition((current) => ({
      current,
      left: e.clientX - diff.x + HELDCONTAINEROFFSET,
      top: e.clientY - diff.y + HELDCONTAINEROFFSET,
    }));

    //Limit this function from being called to 5 times per second

    throttledSetGrabObject.current?.({ ...draggableObject });
    // setGrabbedObject(
    //   (current) => {
    //     if (!current) return null
    //     return { ...draggableObject }
    //   }
    // )
  };
  const dragEnd = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    let selectedDropPoint: DropPositionObject | null = null;

    (
      Object.values(
        draggableContextRef?.current?.activeDropPoints ?? {}
      ) as DropPositionObject[]
    ).forEach((element) => {
      if (
        selectedDropPoint === null ||
        element.distance < selectedDropPoint.distance
      ) {
        selectedDropPoint = element;
      }
    });

    if (
      (selectedDropPoint as unknown as DropPositionObject | null)?.onDrop(
        draggableObject
      )
    ) {
      onDelete?.();
    }
    console.log(
      "Drop immediate",
      draggableObject,
      currentMousePositionRef,
      held
    );
    setHeld(false);
    if (detached) {
      const detachedBounding =
        draggableContextRef?.current?.detachedCanvasRef?.current?.getBoundingClientRect();
      if (!detachedBounding) return;
      setPosition((current) => ({
        ...current,

        left: (e.pageX - diff.x - detachedBounding.left) / scale,
        top: (e.pageY - diff.y - detachedBounding.top) / scale,
      }));
    }
    setGrabbedObject(null);
    setDraggableContext?.((current) => ({
      ...current,
      activeDropPoints: {},
    }));
  };
  const memoedChildren = useMemo(() => {
    return children;
  }, [children]);

  useEffect(() => {
    if (!pickupImmediate) return;
    window.getSelection()?.removeAllRanges();
    setDraggableNodeObjects?.((current) => {
      current.forEach((o) => {
        o.zindex = (o.zindex ?? 0) - 1;
      });

      draggableObject.zindex = current.length;

      return [...current];
    });
    draggableObject.dontGrabImmediately = true;
    setPickupImmediate(false);
  }, [pickupImmediate]);

  if (held) {
    return (
      <ObjectIsGrabbedContext.Provider value={true}>
        <div
          className={styles.heldContainer}
          onMouseMoveCapture={(e) => {
            dragging(e);
          }}
          onMouseUpCapture={(e) => {
            dragEnd(e);
          }}
        >
          <div className={styles.held} style={{ ...position }}>
            <div
              className={styles.heldBorder}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
              ref={currentTarget}
            >
              {children}
            </div>
          </div>
        </div>
      </ObjectIsGrabbedContext.Provider>
    );
  }

  if (detached) {
    return (
      <div
        className={held ? styles.heldContainer : styles.detached}
        onMouseMoveCapture={(e) => {
          if (held) dragging(e);
        }}
        onMouseUpCapture={(e) => {
          if (held) dragEnd(e);
        }}
        style={
          held
            ? {}
            : {
                left: position.left * scale,
                top: position.top * scale,
                pointerEvents: "none",
              }
        }
      >
        <div
          className={held ? styles.held : ""}
          style={held ? { ...position } : { pointerEvents: "none" }}
        >
          <div
            className={held ? styles.heldBorder : styles.detachedBorder}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
            ref={currentTarget}
            onMouseDown={(e) => {
              if (!held) dragStart(e);
            }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onMouseDown={(e) => dragStart(e)} ref={currentTarget}>
      {memoedChildren}
    </div>
  );
};
// DraggableObject.whyDidYouRender = true
export default DraggableObject