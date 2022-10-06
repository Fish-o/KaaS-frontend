import { Button, Progress, Loading } from "@nextui-org/react";
import { isArray } from "lodash";
import { useContext, useEffect, useState, useMemo, useRef } from "react";
import { Filter } from "../../lib/game/Filters";
import styles from "../../styles/gameCreator.module.scss";
import { GrabbedObjectContext, ObjectIsGrabbedContext, TypedNodeProperties } from "../gameCreator";

import { IdleHoverChecker } from "./DropPosition";
import { TypedArgument } from "./typedNode";


function resolveValue(possibleTypes: any, filterObj: any, key: string, grabbedObject: any, held: boolean) {
  //@ts-ignore
  if (!grabbedObject) {
    if (filterObj[key] === "<Placeholder>") {
      //@ts-ignore
      delete filterObj[key]
    }
  }
  if (filterObj[key]) return

  if (grabbedObject && !held) {
    if (possibleTypes.some((possibleType: any) => grabbedObject.data.type.startsWith(possibleType))) {
      //@ts-ignore
      filterObj[key] = "<Placeholder>"
    }
  }
  if (possibleTypes?.includes("string") || possibleTypes?.includes("variable") || possibleTypes?.includes("condition")) {
    //@ts-ignore
    filterObj[key] = undefined
  }
  if (possibleTypes?.includes("array")) {
    //@ts-ignore
    filterObj[key] = new Array()
  }
}
export function recurseResovlve(possibleTypesObj: any, filterObj: any, grabbedObject: any, held: boolean) {
  Object.entries(possibleTypesObj).forEach(([key,]) => {
    let possibleTypes = possibleTypesObj[key] as string[];

    if (Array.isArray(possibleTypes)) {
      resolveValue(possibleTypes, filterObj, key, grabbedObject, held)

    } else {
      filterObj[key] = filterObj[key] || {}
      recurseResovlve(possibleTypes, filterObj[key], grabbedObject, held)
    }
  })
}

function recurseCleanup(filterObj: any) {
  Object.entries(filterObj).forEach(([key, value]) => {
    if (value === "<Placeholder>" || value === undefined || value === null || value === "") {
      //@ts-ignore
      delete filterObj[key]
    } else if (isArray(value) && value.length === 0) {
      //@ts-ignore
      delete filterObj[key]
    }
    else if (typeof value === "object") {
      recurseCleanup(value)

      if (Object.keys(value).length === 0) {
        //@ts-ignore
        delete filterObj[key]
      }
    }
  })
}


export const FilterNode: React.FC<{ filter: Filter }> = ({ filter }) => {
  let held = useContext(ObjectIsGrabbedContext)



  const maximizeTimeout = useRef<NodeJS.Timeout | null>(null)
  const [updater, setUpdater] = useState(0);
  const [maximized, setMaximized] = useState(false);
  const [maximizedDueToHover, setMaximizedDueToHover] = useState(false);
  const grabbedObject = useContext(GrabbedObjectContext);




  function startMaximizeTimeout() {
    if (maximizeTimeout.current) {
      clearTimeout(maximizeTimeout.current)
    }
    maximizeTimeout.current = setTimeout(() => {
      setMaximized(true)
      setMaximizedDueToHover(true)
      maximizeTimeout.current = null
    }, 500)
  }
  useEffect(() => {
    if (!grabbedObject && maximizedDueToHover) {
      setMaximized(false)
      setMaximizedDueToHover(false)
    }
  }, [grabbedObject, maximizedDueToHover])



  return (useMemo(() => {

    if (!filter.filter) {
      filter.filter = {}
    }
    if (maximized) {
      recurseResovlve(TypedNodeProperties[filter.type], filter.filter, grabbedObject, held)

    } else {
      recurseCleanup(filter.filter)
    }
    // Object.entries(TypedNodeProperties[filter.type]).forEach(([key,]) => {
    //   //@ts-ignore
    //   let possibleTypes = TypedNodeProperties[filter.type][key] as string[];
    //   if (Array.isArray(possibleTypes)) {
    //     if (!grabbedObject) {
    //       Object.entries(filter.filter).forEach(([key, value]) => {
    //         if (value === "<Placeholder>") {
    //           //@ts-ignore
    //           delete filter.filter[key]
    //         }
    //       })
    //     }
    //     if (grabbedObject && !held) {
    //       if (possibleTypes.some((possibleType) => grabbedObject.data.type.startsWith(possibleType))) {
    //         //@ts-ignore
    //         if (!filter.filter[key]) {
    //           //@ts-ignore
    //           filter.filter[key] = "<Placeholder>"
    //         }
    //       }
    //     }
    //     if (possibleTypes?.includes("string") || possibleTypes?.includes("variable")) {
    //       //@ts-ignore
    //       if (!filter.filter[key]) {
    //         //@ts-ignore
    //         filter.filter[key] = undefined
    //       }
    //     }
    //   }
    // })


    if (filter.filter.iterator?.actions && !filter.filter.iterator?.parameter) {
      // Reorder and put itterator_parameter at the top lol
      let actions = filter.filter.iterator.actions
      // @ts-ignore
      delete filter.filter.iterator.actions
      filter.filter.iterator.parameter = "$element"
      filter.filter.iterator.actions = actions
    }
    return (
      <IdleHoverChecker
        onHoverExit={() => {
          if (maximizeTimeout.current) {
            clearTimeout(maximizeTimeout.current)
            maximizeTimeout.current = null
          }
        }}
        onHoverEnter={() => { startMaximizeTimeout() }}
        disable={held}
      >

        <div className={styles.filterNode} style={held ? { border: "2px solid red" } : {}}>
          <div className={styles.filterHeader}>
            <h2>{filter.type}</h2>
            <div>
              <Button
                bordered={!maximized}
                disabled={!!maximizeTimeout.current || maximizedDueToHover}
                size="xs"
                onPress={() => { setMaximized((current) => !current) }} >
                {maximizeTimeout.current ?
                  <Loading type="points" color="currentColor" size="sm" />

                  : "Maximize"
                }
              </Button>
            </div>
          </div>
          {
            Object.entries(filter.filter).map(([key, value]) => {
              return (<TypedArgument key={key} $key={key} value={value} object={filter.filter} type={filter.type} held={held} setUpdater={setUpdater}
                acceptableTypes={TypedNodeProperties[filter.type][key as keyof typeof filter.filter]}
                recursiveUpdate={maximized ? 0 : 1}
              />)
            })
          }
          <TypedArgument $key={"maxAmount"} value={filter.maxAmount} object={filter} type={filter.type} held={held} setUpdater={setUpdater}
            acceptableTypes={[
              "number",
            ]}
          />
          <TypedArgument $key={"minAmount"} value={filter.minAmount} object={filter} type={filter.type} held={held} setUpdater={setUpdater}
            acceptableTypes={[
              "number",
            ]}
          />

        </div >
      </IdleHoverChecker>

    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    grabbedObject,
    maximizedDueToHover,
    held,
    filter.type,
    filter,
    filter.filter,
    updater,
    maximized,
    maximizeTimeout,
    maximizeTimeout.current
  ]))


};
