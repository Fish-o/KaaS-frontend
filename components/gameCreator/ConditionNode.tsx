import { useContext, useEffect, useId, useMemo, useState } from "react";
import { Condition } from "../../lib/game/Conditions";
import { SetDraggableNodeObjects, TypedArgument, TypedNodeProperties } from "../gameCreator";
import styles from "../../styles/gameCreator.module.scss";
import { recurseResovlve } from "./FilterNode";


export const ConditionNode: React.FC<{ condition: Condition, held: boolean }> = ({ condition, held = false }) => {
  const [updater, setUpdater] = useState(Date.now())
  const id = useId();
  const setNodeObjects = useContext(SetDraggableNodeObjects)

  const preferedOrder = ["key", "a", "operator", "b", "not", "conditions"]
  return useMemo(() => {
    recurseResovlve(TypedNodeProperties[condition.type], condition, null, held)
    return (
      <div className={styles.conditionNode} style={held ? { border: "2px solid red" } : {}}>
        <h1>Condition: {condition.type}</h1>
        {
          JSON.stringify(condition)
        }
        <div>
          {
            preferedOrder.map((key) => {
              if (key in condition) {
                return (
                  <TypedArgument
                    value={condition[key]}
                    $key={key}
                    object={condition}
                    type={condition.type}
                    held={held}
                    setUpdater={setUpdater}
                    acceptableTypes={TypedNodeProperties[condition.type][key]}
                    orientation={"vertical"}
                  />
                )
              }
              return null
            })
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
  }, [condition, held, updater])
}