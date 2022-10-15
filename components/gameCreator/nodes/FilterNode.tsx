import { Button, Progress, Loading } from "@nextui-org/react";
import { isArray } from "lodash";
import { useContext, useEffect, useState, useMemo, useRef, memo, MutableRefObject, Dispatch, SetStateAction } from "react";
import useStateRef from "react-usestateref";
import { Filter } from "../../../lib/game/Filters";
import styles from "../../../styles/gameCreator.module.scss";
import { GrabbedObjectTypeContext, ObjectIsGrabbedContext } from "../../gameCreator";
import { TypedNodeProperties } from "../../TypedNodeProperties";
import { IdleHoverChecker } from "../DropPosition";
import { NodeOptions } from "../NodeOptions";
import { TypedArgument } from "../typedNode";


function resolveValue(possibleTypes: any, filterObj: any, key: string, grabbedObjectType: any) {
  //@ts-ignore
  if (!grabbedObjectType) {
    if (filterObj[key] === "<Placeholder>") {
      //@ts-ignore
      delete filterObj[key]
    }
  }
  if (filterObj[key]) return

  if (possibleTypes?.includes("string") || possibleTypes?.includes("variable") || possibleTypes?.includes("condition")) {
    //@ts-ignore
    filterObj[key] = undefined
  }
  if (possibleTypes?.includes("array")) {
    //@ts-ignore
    filterObj[key] = new Array()
  }
}
export function recurseResolve(possibleTypesObj: any, data: any, grabbedObjectType: any) {
  if (!possibleTypesObj) return data
  Object.entries(possibleTypesObj).forEach(([key,]) => {
    let possibleTypes = possibleTypesObj[key] as string[];

    if (Array.isArray(possibleTypes)) {

      resolveValue(possibleTypes, data, key, grabbedObjectType)

    } else {
      data[key] = data[key] || {}
      recurseResolve(possibleTypes, data[key], grabbedObjectType)
    }
  })
  return data
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

export const FilterResolver: React.FC<{ filter: Filter }> = memo(({ filter }) => {
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
  const grabbedObjectType = useContext(GrabbedObjectTypeContext);



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
    if (!grabbedObjectType && maximizedDueToHover) {
      setMaximized(false)
      setMaximizedDueToHover(false)
    }
  }, [grabbedObjectType, maximizedDueToHover])


  useEffect(() => {
    console.log("setting from maximized")
    if (maximized) {
      setData(data => ({ ...recurseResolve(TypedNodeProperties[filter.type], data, grabbedObjectType) }))

    } else {
      setData(data => ({ ...recurseCleanup(data) }))
    }
  }, [filter.type, grabbedObjectType, maximized, setData])



  // TODO fix itterator parameter as always being an option

  // TODO convert this into a priority list
  if ((dataRef.current.iterator?.actions?.length ?? 0) > 0 && !dataRef.current.iterator?.parameter) {
    // Reorder and put itterator_parameter at the top lol
    // @ts-ignore

    let actions = dataRef.current.iterator.actions
    // @ts-ignore
    delete dataRef.current.iterator.actions
    // @ts-ignore
    dataRef.current.iterator.parameter = "$element"
    // @ts-ignore
    dataRef.current.iterator.actions = actions
  }
  return (<IdleHoverChecker
    onHoverExit={() => {
      if (maximizeTimeout.current) {
        clearTimeout(maximizeTimeout.current)
        maximizeTimeout.current = null
      }
    }}
    onHoverEnter={() => { startMaximizeTimeout() }}
  >
    <FilterNode
      data={data}
      setData={setData}
      type={filter.type}
      maximized={maximized}
      maximizeTimeout={maximizeTimeout}
      setMaximized={setMaximized}
      maximizedDueToHover={maximizedDueToHover}
    />

  </IdleHoverChecker>)
})
FilterResolver.displayName = "FilterResolver"



const FilterNode: React.FC<{
  type: Filter["type"],
  data: Filter["filter"],
  setData: Dispatch<SetStateAction<Filter["filter"]>>,
  maximized: boolean,
  maximizeTimeout: MutableRefObject<NodeJS.Timeout | null>,
  maximizedDueToHover: boolean,
  setMaximized: Dispatch<SetStateAction<boolean>>
}> =
  memo(({ type, data, setData, maximized, maximizeTimeout, maximizedDueToHover, setMaximized }) => {

    return (
      <div className={styles.filterNode} >
        <div className={styles.filterHeader}>
          <h2>{type}</h2>
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
          Object.entries(data).map(([key, value]) => {
            return (
              <TypedArgument
                key={key}
                $key={key}
                value={value}
                setValue={(newValue) => {
                  setData((oldValue) => {
                    if (newValue === undefined) {
                      // @ts-ignore
                      delete oldValue[key]
                    } else {
                      // @ts-ignore
                      oldValue[key] = newValue
                    }
                    return { ...oldValue }
                  })
                }}
                acceptableTypes={TypedNodeProperties[type][key as keyof typeof data]}
                recursiveUpdate={maximized ? 0 : 1}
              />
            )
          })
        }
      </div >
    )
  })
FilterNode.displayName = "FilterNode"
FilterNode.whyDidYouRender = true
