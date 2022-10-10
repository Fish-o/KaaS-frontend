import { Button, Progress, Loading } from "@nextui-org/react";
import { isArray } from "lodash";
import { useContext, useEffect, useState, useMemo, useRef } from "react";
import useStateRef from "react-usestateref";
import { Filter } from "../../lib/game/Filters";
import styles from "../../styles/gameCreator.module.scss";
import { GrabbedObjectContext, ObjectIsGrabbedContext } from "../gameCreator";
import { TypedNodeProperties } from "../TypedNodeProperties";
import { IdleHoverChecker } from "./DropPosition";
import { NodeOptions } from "./NodeOptions";
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
export function recurseResolve(possibleTypesObj: any, filterObj: any, grabbedObject: any, held: boolean) {
  Object.entries(possibleTypesObj).forEach(([key,]) => {
    let possibleTypes = possibleTypesObj[key] as string[];

    if (Array.isArray(possibleTypes)) {
      resolveValue(possibleTypes, filterObj, key, grabbedObject, held)

    } else {
      filterObj[key] = filterObj[key] || {}
      recurseResolve(possibleTypes, filterObj[key], grabbedObject, held)
    }
  })
  return filterObj
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
  return filterObj
}


export const FilterNode: React.FC<{ filter: Filter }> = ({ filter }) => {
  let held = useContext(ObjectIsGrabbedContext)
  if (!filter.filter) {
    filter.filter = {
      maxAmount: 1,
      minAmount: 1,
    }
  }
  const [data, setData, dataRef] = useStateRef<typeof filter.filter>(filter.filter);
  useEffect(() => {
    filter.filter = data;
  }, [data, filter]);
  const grabbedObject = useContext(GrabbedObjectContext);



  const maximizeTimeout = useRef<NodeJS.Timeout | null>(null)
  const [maximized, setMaximized] = useState(false);
  const [maximizedDueToHover, setMaximizedDueToHover] = useState(false);
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


  useEffect(() => {
    if (maximized) {
      setData(data => ({ ...recurseResolve(TypedNodeProperties[filter.type], data, grabbedObject, held) }))

    } else {
      setData(data => ({ ...recurseCleanup(data) }))
    }
  }, [filter.filter, filter.type, grabbedObject, held, maximized, setData])



  // TODO fix itterator parameter as always being an option

  // TODO convert this into a priority list
  if ((dataRef.current.iterator?.actions?.length ?? 0) > 0 && !dataRef.current.iterator?.parameter) {
    // Reorder and put itterator_parameter at the top lol
    let actions = dataRef.current.iterator.actions
    // @ts-ignore
    delete dataRef.current.iterator.actions
    dataRef.current.iterator.parameter = "$element"
    dataRef.current.iterator.actions = actions
  }

  return (useMemo(() => {
    return (
      <IdleHoverChecker
        onHoverExit={() => {
          if (maximizeTimeout.current) {
            clearTimeout(maximizeTimeout.current)
            maximizeTimeout.current = null
          }
        }}
        onHoverEnter={() => { startMaximizeTimeout() }}
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
            Object.entries(dataRef.current).map(([key, value]) => {
              return (
                <TypedArgument
                  key={key}
                  $key={key}
                  value={value}
                  setValue={(newValue) => {
                    setData((data) => ({ ...data, [key]: newValue }))
                  }}
                  acceptableTypes={TypedNodeProperties[filter.type][key as keyof typeof filter.filter]}
                  recursiveUpdate={maximized ? 0 : 1}
                />
              )
            })
          }
        </div >
      </IdleHoverChecker>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [held, filter, maximized, maximizedDueToHover, dataRef, setData, data]))


};
