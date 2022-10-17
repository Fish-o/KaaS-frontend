import { useMemo } from "react"
import { Dispatch, SetStateAction, memo } from "react"
import { KeysOfUnion, NodableObjectTypes, ObjectDatas } from "../gameCreator"
import { TypedArgument } from "./typedNode"




interface props<T> {

  type: NodableObjectTypes["type"],
  data: Exclude<ObjectDatas, undefined>,
  setData: Dispatch<SetStateAction<Exclude<any, undefined>>>,
  prefix?: string,
  TypedDataObject: any
  preferredOrder?: (KeysOfUnion<ObjectDatas>)[]

}

interface NodeDataProps<T> {
  type: NodableObjectTypes["type"];
  data: T;
  setData: Dispatch<SetStateAction<T>>;
  prefix?: string;
  TypedDataObject: any;
  DefaultDataObject: any;
  showDefaults?: boolean;
  allowDelete?: boolean;
}

export function NodeData<T extends ObjectDatas>({
  type,
  data,
  setData,
  prefix,
  TypedDataObject,
  DefaultDataObject,
  showDefaults = false,
  allowDelete = false,
}: NodeDataProps<T>) {
  return useMemo(() => {
    let orderedEntries = Object.entries(data);

    orderedEntries = orderedEntries.filter(([key, value]) => {
      // if the value is a default
      if (
        DefaultDataObject?.[type] &&
        value === DefaultDataObject?.[type][key] &&
        !showDefaults
      ) {
        // remove it
        return false;
      }
      return true;
    });

    // let orderedEntries = [];
    // if (preferredOrder) {
    //   preferredOrder.forEach((key) => {
    //     let foundEntry = unorderedEntries.find((search) => search[0] === key);
    //     if (foundEntry) {
    //       orderedEntries.push(foundEntry);
    //       let foundEntryIndex = unorderedEntries.findIndex(
    //         (search) => search[0] === key
    //       );
    //       unorderedEntries.splice(foundEntryIndex, 1);
    //     }
    //   });
    // }
    // orderedEntries.push(...unorderedEntries);

    return (
      <>
        {prefix ? <h2>{prefix}</h2> : null}
        {orderedEntries.map(([key, value], index) => {
          return (
            <TypedArgument
              value={value}
              $key={key}
              setValue={(newValue) => {
                setData((oldValue: any) => {
                  console.log("setting value 3", newValue);

                  if (newValue === "__$$DELETE$$__") {
                    delete oldValue[key];
                    return { ...oldValue };
                  }

                  if (newValue === undefined && allowDelete) {
                    // @ts-ignore
                    delete oldValue[key];
                  } else {
                    console.log("setting value 3", newValue);
                    // @ts-ignore
                    oldValue[key] = newValue;
                  }
                  return { ...oldValue };
                });
              }}
              key={key}
              acceptableTypes={TypedDataObject[type][key as keyof typeof data]}
              defaultValue={
                DefaultDataObject?.[type]?.[key as keyof typeof data]
              }
            />
          );
        })}
      </>
    );
  }, [type, data, setData, prefix, TypedDataObject, showDefaults]);
}
NodeData.displayName = "NodeData"