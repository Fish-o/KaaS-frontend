import { useContext, useEffect, useId, useMemo, useState } from "react";
import { Condition } from "../../lib/game/Conditions";
import { ObjectIsGrabbedContext, SetDraggableNodeObjects, TypedNodeProperties } from "../gameCreator";
import styles from "../../styles/gameCreator.module.scss";
import { recurseResovlve } from "./FilterNode";
import { TypedArgument } from "./typedNode";


export const ConditionNode: React.FC<{ condition: Condition }> = ({ condition }) => {
  let held = useContext(ObjectIsGrabbedContext)

  const [updater, setUpdater] = useState(Date.now())

  return useMemo(() => {
    const preferedOrder = ["key", "a", "operator", "b", "not", "conditions"]

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






      </div >)
  }, [condition, held, updater])
}