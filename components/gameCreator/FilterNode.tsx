import { useContext, useEffect, useState, useMemo } from "react";
import { Filter } from "../../lib/game/Filters";
import styles from "../../styles/gameCreator.module.scss";
import { GrabbedObjectContext, TypedArgument, TypedNodeProperties } from "../gameCreator";



export const FilterNode: React.FC<{ filter: Filter, rootHeld?: boolean, held?: boolean }> = ({ filter, rootHeld = false, held = false }) => {
  // filter.filter.$and
  // switch (filter.type) {
  //   case "filter:card":
  //     filter.filter.$and
  held = rootHeld || held
  const [updater, setUpdater] = useState(0);

  const grabbedObject = useContext(GrabbedObjectContext);

  return (useMemo(() => {
    if (!filter.filter) {
      filter.filter = {}
    }
    Object.entries(TypedNodeProperties[filter.type]).forEach(([key,]) => {
      //@ts-ignore
      let possibleTypes = TypedNodeProperties[filter.type][key] as string[];
      if (Array.isArray(possibleTypes)) {
        if (grabbedObject && !held) {
          if (possibleTypes.some((possibleType) => grabbedObject.data.type.startsWith(possibleType))) {
            //@ts-ignore
            if (!filter.filter[key]) {
              //@ts-ignore
              filter.filter[key] = "<Placeholder>"
            }
          }
        }
        if (possibleTypes?.includes("string") || possibleTypes?.includes("variable")) {
          //@ts-ignore
          if (!filter.filter[key]) {
            //@ts-ignore
            filter.filter[key] = undefined
          }
        }
      }
    })
    if (!grabbedObject) {
      Object.entries(filter.filter).forEach(([key, value]) => {
        if (value === "<Placeholder>") {
          //@ts-ignore
          delete filter.filter[key]
        }
      })
    }

    if (filter.filter.actions && !filter.filter.iterator_parameter) {
      // Reorder and put itterator_parameter at the top lol
      let actions = filter.filter.actions
      delete filter.filter.actions
      filter.filter.iterator_parameter = "$element"
      filter.filter.actions = actions
    }
    return (
      <div className={styles.filterNode} >
        <h2 >{filter.type}</h2>
        {
          Object.entries(filter.filter).map(([key, value]) => {
            return (<TypedArgument key={key} $key={key} value={value} object={filter.filter} type={filter.type} held={held} setUpdater={setUpdater} />)
          })
        }
      </div >
    )
  }, [grabbedObject?.data.type, held, filter.type, filter.filter]))

};
