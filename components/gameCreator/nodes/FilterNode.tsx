import { Button, Progress, Loading } from "@nextui-org/react";
import { isArray } from "lodash";
import { useContext, useEffect, useState, useMemo, useRef, memo, MutableRefObject, Dispatch, SetStateAction } from "react";
import useStateRef from "react-usestateref";
import { Filter } from "../../../lib/game/Filters";
import styles from "../../../styles/gameCreator.module.scss";
import { GrabbedObjectTypeContext, ObjectIsGrabbedContext } from "../../gameCreator";
import {
  DefaultValueNodeProperties,
  FilterNodeProperties,
} from "../../TypedNodeProperties";
import { IdleHoverChecker } from "../DropPosition";
import { NodeData } from "../NodeData";
import { NodeOptions } from "../NodeOptions";
import { TypedArgument } from "../typedNode";

function resolveValue(
  possibleTypes: any,
  defaultValue: any,
  filterObj: any,
  key: string,
  grabbedObjectType: any
) {
  //@ts-ignore
  if (!grabbedObjectType) {
    if (filterObj[key] === "<Placeholder>") {
      //@ts-ignore
      delete filterObj[key];
    }
  }
  if (filterObj[key]) return;
  if (filterObj[key] === 0) return;
  if (defaultValue) {
    filterObj[key] = defaultValue;
    return;
  }
  if (possibleTypes?.includes("array")) {
    //@ts-ignore
    filterObj[key] = new Array();
    return;
  }
  if (
    possibleTypes?.includes("string") ||
    possibleTypes?.includes("variable") ||
    possibleTypes?.includes("condition")
  ) {
    //@ts-ignore
    filterObj[key] = undefined;
    return;
  }

  filterObj[key] = undefined;
}
function reorderObject(obj: any, order: string[]) {
  // Reorder the keys in an object by only mutating. using delete but keeping the values
  // The input and output have to be the same object
  // example: reorderObject({a: 1, b: 2, c: 3}, ['c', 'b', 'a']) // {c: 3, b: 2, a: 1}

  // Get the keys of the object
  const keys = Object.keys(obj);

  // the order may only have some of the keys
  // so we need to add the missing keys to the end
  const missingKeys = keys.filter((key) => !order.includes(key));
  order = [...order, ...missingKeys];

  // If the keys are the same as the order, return the object
  if (keys.join() === order.join()) return obj;

  let savedValues = {} as any;

  // Delete all the keys from the object (but keep the values)
  keys.forEach((key) => {
    savedValues[key] = obj[key];
    delete obj[key];
  });

  // Reorder the keys
  order.forEach((key) => {
    obj[key] = savedValues[key];
  });

  return obj;
}

export function recurseResolve(
  possibleTypesObj: any,
  defaultValuesObj: Record<string, any> | undefined = {},
  data: any,
  grabbedObjectType: any
) {
  if (!possibleTypesObj) return data;
  Object.entries(possibleTypesObj).forEach(([key]) => {
    let possibleTypes = possibleTypesObj[key] as string[];
    let defaultValue = undefined;
    if (defaultValuesObj) {
      defaultValue = defaultValuesObj[key];
    }
    if (Array.isArray(possibleTypes)) {
      resolveValue(possibleTypes, defaultValue, data, key, grabbedObjectType);
    } else {
      data[key] = data[key] || {};
      recurseResolve(
        possibleTypes,
        defaultValuesObj[key],
        data[key],
        grabbedObjectType
      );
    }
  });
  reorderObject(data, Object.keys(possibleTypesObj));
  return data;
}

function recurseCleanup(
  filterObj: any,
  defaultValuesObj: any = {},
  topLevel = false
) {
  let onlyDefaults = true;
  Object.entries(filterObj).forEach(([key, value]) => {
    if (
      value === "<Placeholder>" ||
      value === undefined ||
      value === null ||
      value === ""
    ) {
      //@ts-ignore
      delete filterObj[key];
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        //@ts-ignore
        delete filterObj[key];
      } else {
        onlyDefaults = false;
      }
    } else if (typeof value === "object") {
      const hasOnlyDefaults = recurseCleanup(value, defaultValuesObj[key]);
      if (
        Object.keys(hasOnlyDefaults).length === 0 ||
        Object.keys(value).length === 0
      ) {
        //@ts-ignore
        delete filterObj[key];
      }
    } else if (value !== defaultValuesObj[key]) {
      onlyDefaults = false;
    } else if (topLevel) {
      //@ts-ignore
      // delete filterObj[key];
    }
  });
  if (topLevel) {
    return filterObj;
  }
  if (onlyDefaults) return {};
  return filterObj;
}

export const FilterResolver: React.FC<{ filter: Filter }> = memo(
  ({ filter }) => {
    const type = filter.type;
    if (!filter.filter) {
      filter.filter = {
        maxAmount: 1,
        minAmount: 1,
      };
    }
    const [data, setData, dataRef] = useStateRef<typeof filter.filter>(
      filter.filter
    );
    console.log("Filter", { ...data });
    useEffect(() => {
      filter.filter = data;
    }, [data, filter]);
    const grabbedObjectType = useContext(GrabbedObjectTypeContext);

    const maximizeTimeout = useRef<NodeJS.Timeout | null>(null);
    // @ts-ignore
    const [maximized, setMaximized] = useState(filter.__maximized || false);

    useEffect(() => {
      if (maximized) {
        // Set a secret property on the filter to make it maximized
        Object.defineProperty(filter, "__maximized", {
          value: true,
          writable: true,
          enumerable: false,
          configurable: true,
        });
      } else {
        // Remove the secret property
        // @ts-ignore
        delete filter.__maximized;
      }
    }, [maximized, filter]);

    const [maximizedDueToHover, setMaximizedDueToHover] = useState(false);
    function startMaximizeTimeout() {
      if (maximizeTimeout.current) {
        clearTimeout(maximizeTimeout.current);
      }
      maximizeTimeout.current = setTimeout(() => {
        setMaximized(true);
        setMaximizedDueToHover(true);
        maximizeTimeout.current = null;
      }, 500);
    }
    useEffect(() => {
      if (!grabbedObjectType && maximizedDueToHover) {
        setMaximized(false);
        setMaximizedDueToHover(false);
      }
    }, [grabbedObjectType, maximizedDueToHover]);

    useEffect(() => {
      if (maximized) {
        setData((data) => ({
          ...recurseResolve(
            FilterNodeProperties[type],
            DefaultValueNodeProperties[type],
            data,
            grabbedObjectType
          ),
        }));
      } else {
        setData((data) => ({
          ...recurseCleanup(data, DefaultValueNodeProperties[type], true),
        }));
      }
    }, [type, grabbedObjectType, maximized, setData]);
    console.log("Filter2", { ...dataRef.current });

    return (
      <IdleHoverChecker
        onHoverExit={() => {
          if (maximizeTimeout.current) {
            clearTimeout(maximizeTimeout.current);
            maximizeTimeout.current = null;
          }
        }}
        onHoverEnter={() => {
          startMaximizeTimeout();
        }}
      >
        <div className={styles.filterNode}>
          <div className={styles.filterHeader}>
            {/* {JSON.stringify(dataRef.current)} */}
            <h2>{type}</h2>
            <div>
              <Button
                bordered={!maximized}
                disabled={!!maximizeTimeout.current || maximizedDueToHover}
                size="xs"
                onPress={() => {
                  setMaximized((current: any) => !current);
                }}
              >
                {maximizeTimeout.current ? (
                  <Loading type="points" color="currentColor" size="sm" />
                ) : (
                  "Maximize"
                )}
              </Button>
            </div>
          </div>
          <NodeData
            type={type}
            data={data}
            setData={setData}
            DefaultDataObject={DefaultValueNodeProperties}
            TypedDataObject={FilterNodeProperties}
            showDefaults={maximized}
            allowDelete
          />
        </div>
      </IdleHoverChecker>
    );
  }
);
FilterResolver.displayName = "FilterResolver";


