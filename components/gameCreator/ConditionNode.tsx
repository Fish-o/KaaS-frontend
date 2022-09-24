import { useContext, useEffect, useId, useMemo, useState } from "react";
import { Condition } from "../../lib/game/Conditions";
import { DraggableNodeObjects, SetDraggableNodeObjects, TypedArgument } from "../gameCreator";
import { ActionNode } from "./ActionNode";
import DraggableObject from "./draggableObject";
import styles from "../../styles/gameCreator.module.scss";


export const ConditionNode: React.FC<{ condition: Condition, held: boolean }> = ({ condition, held = false }) => {
  const [updater, setUpdater] = useState(Date.now())
  const id = useId();
  const setNodeObjects = useContext(SetDraggableNodeObjects)


  return useMemo(() => {
    return (
      <div className={styles.conditionNode}>
        <h1>Condition: {condition.type}</h1>
        <div>
          {
            "a" in condition && condition.a && (
              <TypedArgument value={condition.a} $key={"a"} object={condition} type={condition.type} held={held} setUpdater={setUpdater} />
            )
          }

          <TypedArgument value={condition.operator} $key={"operator"} object={condition} type={condition.type} held={held} setUpdater={setUpdater} />


          {
            "b" in condition && condition.b && (
              <TypedArgument value={condition.b} $key={"b"} object={condition} type={condition.type} held={held} setUpdater={setUpdater} />

            )
          }
        </div>






        {/* <EventDropPosition event={event} id={id} i={0} setUpdater={setUpdater} held={held} />
        {event.actions.map((a, i) => (
          // <div key={`tl-${id}-${Object.uniqueID(a)}`} style={{ border: "solid 2px black" }}>
          <div key={`${id}-${Object.uniqueID(a)}`}>

            <DraggableObject
              onGrab={(draggableObject) => {
                
                event.actions.splice(i, 1);
                setUpdater(current => current + 1)
              }}
              fillData={a}
            >
              <ActionNode action={a} key={`${id}-${Object.uniqueID(a)}`} />
            </DraggableObject>

            <EventDropPosition event={event} id={id} i={i} key={`dp_${id}-${Object.uniqueID(a)}`} setUpdater={setUpdater} held={held} />
          </div >
          // </div>
        )) */}
        {/* } */}
      </div >)
  }, [condition, held])
}