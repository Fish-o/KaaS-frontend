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

  type: NodableObjectTypes["type"],
  data: T,
  setData: Dispatch<SetStateAction<T>>,
  prefix?: string,
  TypedDataObject: any
  preferredOrder?: (KeysOfUnion<T>)[]

}


export function NodeData<T extends ObjectDatas>({ type, data, setData, prefix, TypedDataObject, preferredOrder: preferredOrder }: NodeDataProps<T>) {
  return useMemo(() => {
    let unorderedEntries = Object.entries(data)
    let orderedEntries = []
    if (preferredOrder) {
      preferredOrder.forEach((key) => {
        let foundEntry = unorderedEntries.find((search) => search[0] === key)
        if (foundEntry) {
          console.log("foundEntry", foundEntry)
          orderedEntries.push(foundEntry)
          let foundEntryIndex = unorderedEntries.findIndex((search) => search[0] === key)
          unorderedEntries.splice(foundEntryIndex, 1)
        }
      })
    }
    orderedEntries.push(...unorderedEntries)

    return (
      <>
        {prefix ? <h2>{prefix}</h2> : null}
        {orderedEntries.map(([key, value], index) => {
          return <TypedArgument
            value={value}
            $key={key}
            setValue={(newValue) => {
              setData((oldValue: any) => {
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
            key={key}
            acceptableTypes={TypedDataObject[type][key as (keyof typeof data)]}
          />
        })
        }
      </>
    )
  }, [type, data, setData, prefix, TypedDataObject, preferredOrder])
}
NodeData.displayName = "NodeData"