import { memo, useEffect, useMemo, useState } from "react";
import { Condition } from "../../../lib/game/Conditions";
import styles from "../../../styles/gameCreator.module.scss";
import { recurseResolve } from "./FilterNode";
import { TypedNodeProperties } from "../../TypedNodeProperties";
import { NodeData } from "../NodeData";


export const ConditionNode: React.FC<{ condition: Condition }> = memo(({ condition }) => {
  let type = condition.type
  if (!condition.condition) {
    // @ts-ignore
    condition.condition = {}
  }
  const [data, setData] = useState(condition.condition);
  useEffect(() => {
    condition.condition = data;
  }, [data, condition])

  useEffect(() => {
    setData(data => recurseResolve(TypedNodeProperties[type], data, null))
  }, [condition, setData, type])
  return (
    <div className={styles.conditionNode}>
      <h1>Condition: {type}</h1>

      <div>
        <NodeData
          data={data}
          setData={setData}
          TypedDataObject={TypedNodeProperties}
          type={type}
          preferredOrder={["key", "a", "operator", "b", "conditions", "not"]}
        />
      </div>
    </div >
  )
})
ConditionNode.displayName = "ConditionNode"