import { useContext, useEffect, useId, useMemo, useState } from "react";
import { Condition } from "../../lib/game/Conditions";
import { ObjectIsGrabbedContext, SetDraggableNodeObjects } from "../gameCreator";
import styles from "../../styles/gameCreator.module.scss";
import { recurseResolve } from "./FilterNode";
import { TypedArgument } from "./typedNode";
import useStateRef from "react-usestateref";
import { TypedNodeProperties } from "../TypedNodeProperties";


export const ConditionNode: React.FC<{ condition: Condition }> = ({ condition }) => {
  let held = useContext(ObjectIsGrabbedContext)
  if (!condition.condition) {
    // @ts-ignore
    condition.condition = {}
  }
  const [data, setData, dataRef] = useStateRef(condition.condition);
  useEffect(() => {
    condition.condition = data;
  }, [data, condition])

  useEffect(() => {
    setData(data => recurseResolve(TypedNodeProperties[condition.type], data, null, held))
  }, [condition])



  return useMemo(() => {
    const preferedOrder = ["key", "a", "operator", "b", "conditions", "not"]

    return (
      <div className={styles.conditionNode} style={held ? { border: "2px solid red" } : {}}>
        <h1>Condition: {condition.type}</h1>

        <div>
          {
            preferedOrder.map((key) => {
              if (key in dataRef.current) {
                let value = dataRef.current[key as keyof typeof data];
                let properties = TypedNodeProperties[condition.type][key as keyof typeof data]
                return (
                  <TypedArgument
                    value={value}
                    $key={key}
                    setValue={(value) => {
                      setData(data => ({ ...data, [key]: value }))
                    }}
                    acceptableTypes={properties}
                    orientation={"vertical"}
                  />
                )
              }
              return null
            })
          }

        </div>






      </div >)
  }, [condition, held, data])
}