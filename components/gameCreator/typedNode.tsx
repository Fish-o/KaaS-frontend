import { Button, FormElement, Input, useInput, Grid } from "@nextui-org/react";
import { isArray, isNumber } from "lodash";
import React, { memo, useContext, useEffect, useMemo, useState } from "react";
import { Action } from "../../lib/game/Actions";
import { Condition } from "../../lib/game/Conditions";
import { Filter } from "../../lib/game/Filters";
import { GrabbedObject, ObjectIsGrabbedContext, ObjectTypes } from "../gameCreator";
import DropPosition from "./DropPosition";
import styles from "../../styles/gameCreator.module.scss";
import DraggableObject from "./draggableObject";
import { ResolveNodeType } from "./resolveNodeType";

type AcceptableTypes = "string" | "array" | "number" | "variable" | "required" | GrabbedObject["data"]["type"] | `string:${string}`
  | "action" | "condition"


export type AcceptableTypesArray = AcceptableTypes[] |
{
  [key: string]: AcceptableTypesArray
}


type AcceptableValueTypes = string | number | boolean | Filter | Action | Condition | AcceptableValueTypes[] | { [key: string]: AcceptableValueTypes }


const ResolveGrabbedNode: React.FC<{ data: ObjectTypes, i?: number, object: any, $key: string, held: boolean, allowedDropTypes: ObjectTypes["type"], setUpdater: React.Dispatch<React.SetStateAction<number>> }> = ({ data, i, object, $key, held, allowedDropTypes, setUpdater }) => {


  if (isNumber(i)) {
    return <>

      <DraggableObject fillData={data} onGrab={(grabbedObject) => {
        if (isNumber(i)) {
          object[$key].splice(i, 1)
          setUpdater(current => current + 1)
        }
      }}>
        <ResolveNodeType objectData={data} />

      </DraggableObject>
      <DropPosition onDrop={(grabbedObject) => {
        if (isNumber(i)) {
          object[$key].splice(i + 1, 0, grabbedObject.data)
          setUpdater(current => current + 1)
          return true;
        }
        return false
      }} disable={held}
        config={{
          overHeight: 0,
          overWidth: 0,
          activeStyle: {
            marginTop: "10px",
            marginBottom: "10px",
          },
          inactiveStyle: {
            marginTop: "5px",
            marginBottom: "5px",
            width: "100%",
          },
          type: allowedDropTypes
        }}


      />
    </>
  }
  return (
    <DraggableObject fillData={data} onGrab={(grabbedObject) => {
      console.log("grabbedObject", grabbedObject)
      object[$key] = undefined
      setUpdater(current => current + 1)
    }}>
      <ResolveNodeType objectData={data} />

    </DraggableObject>
  )
}

export const TypedInput: React.FC<{ initialValue: string | number | undefined, numberOnly: boolean, varaiblesAllowed: boolean, required: boolean, specificStringsAllowed: string[] | null, setValue: (arg0: string) => void }> =
  ({ initialValue, numberOnly = false, varaiblesAllowed: varaibleAllowed = false, required = false, specificStringsAllowed, setValue }) => {
    const { value, bindings } = useInput(initialValue?.toString() || "");


    const getVaraibleHelper = (value: string): {
      status: "error" | "success" | "default" | "warning",
      helperText: string
    } => {
      if (!value.startsWith("$")) {
        return {
          status: "error",
          helperText: "This field must be a variable"
        }
      }
      if (value.startsWith("$") && value.length == 1) {
        return {
          status: "error",
          helperText: "Variables must have more then 1 character"
        }
      }
      if (value.startsWith("$") && value.length < 5) {
        return {
          status: "warning",
          helperText: "Variables should be more then 3 characters"
        }
      }
      return {
        status: "default",
        helperText: ""
      }
    }

    const getHelper = (value: string): {
      status: "error" | "success" | "default" | "warning",
      helperText: string
    } => {
      if (required && (!value || value == "")) {
        return {
          status: "error",
          helperText: "This field is required"
        }
      }
      if (numberOnly && isNaN(Number(value))) {
        return {
          status: "error",
          helperText: "This field must be a number"
        }
      }
      if (specificStringsAllowed && !specificStringsAllowed.includes(value)) {
        return {
          status: "error",
          helperText: "This field must be one of the following: " + specificStringsAllowed.join(", ")
        }
      }


      if (varaibleAllowed && value != "") {
        return getVaraibleHelper(value)
      }

      return {
        status: "default",
        helperText: ""
      }
    }


    const helper = useMemo(() => {

      const helper = getHelper(value);
      if (helper.status !== "error") setValue(value)

      return {
        ...helper,
        placeholder: value == "" ? "[Undefined]" : ""
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);




    return (
      <Input
        {...bindings}
        {...helper}

        onClick={(e) => {
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        aria-label={"Argument input"}


      />
    )
  }


function getAllowedInputTypes(acceptableTypes: string[]) {
  let specificStringsAllowed: string[] | null = null;
  specificStringsAllowed = (acceptableTypes.filter((type) => type.startsWith("string:"))).map((type) => type.replace("string:", ""))
  if (specificStringsAllowed.length == 0) {
    specificStringsAllowed = null
  }

  return {
    multipleAllowed: acceptableTypes.includes("array"),
    stringsAllowed: acceptableTypes.includes("string"),
    numbersAllowed: acceptableTypes.includes("number"),
    variablesAllowed: acceptableTypes.includes("variable"),
    required: acceptableTypes.includes("required"),
    nodeAllowed: acceptableTypes.some((type) => (type.startsWith("filter:") || type.startsWith("action") || type.startsWith("condition"))),

    nodeTypes: acceptableTypes.filter(value => value != "string" && value != "array") as unknown as ObjectTypes["type"],
    specificStringsAllowed
  }

}

export const ActualResolvedValue: React.FC<{ value: any, allowedInputTypes: any, setValue: (arg0: any) => void }> = ({ value, allowedInputTypes, setValue }) => {
  // const [value, setValue] = useState(initValue)
  // useEffect(() => {
  //   initSetValue(value)
  // }, [value, initSetValue])


  if (typeof value === "object") {
    return (
      <DraggableObject fillData={value} onGrab={() => {
        setValue(undefined)
      }}>
        <ResolveNodeType objectData={value} />
      </DraggableObject>
    )
  }

  if (allowedInputTypes.stringsAllowed || allowedInputTypes.variablesAllowed || allowedInputTypes.specificStringsAllowed || allowedInputTypes.numbersAllowed) {
    return (
      <>
        <DropPosition
          config={{ type: allowedInputTypes.nodeTypes }}
          onDrop={(grabbedObject) => {
            // @ts-ignore
            setValue(grabbedObject.data);
            return true;
          }} disable={true} key={value} >
          <div onClick={(e) => {
            e.stopPropagation();
          }} onMouseDown={(e) => {
            e.stopPropagation();
          }}  >
          </div>
        </DropPosition>
        {JSON.stringify(allowedInputTypes.nodeTypes)}

        <TypedInput
          numberOnly={allowedInputTypes.numbersAllowed}
          required={allowedInputTypes.required}
          varaiblesAllowed={allowedInputTypes.variablesAllowed}
          specificStringsAllowed={allowedInputTypes.specificStringsAllowed}

          initialValue={value}
          setValue={(value) => {
            // @ts-ignore
            setValue(value);
          }}
        />
      </>

    )
  }

  if (allowedInputTypes.nodeAllowed) {
    return (
      <DropPosition config={{ type: allowedInputTypes.nodeTypes }}
        onDrop={(grabbedObject) => {
          console.log("dropped", grabbedObject)
          debugger
          // @ts-ignore
          setValue(grabbedObject.data);
          return true;
        }} disable={true} key={value} >
        <div onClick={(e) => {
          e.stopPropagation();
        }} onMouseDown={(e) => {
          e.stopPropagation();
        }}  >
        </div>
      </DropPosition>


    )

  }

  return <h1>ERROR typeof value: {typeof value}, acceptableTypes: {JSON.stringify(allowedInputTypes)}</h1>
}



// TODO Refactor this completely
export const TypedArgument: React.FC<
  {
    $key: string | number,
    value: any,
    object: Exclude<Action["args"] | Action["returns"] | Filter["filter"] | Condition, undefined>,
    type: (Action | Filter | Condition)["type"],



    setUpdater: React.Dispatch<React.SetStateAction<number>>,
    orientation?: "horizontal" | "vertical",
    acceptableTypes: AcceptableTypesArray
    recursiveUpdate?: number
  }>
  = memo(({ $key: key, value, object, type, setUpdater, orientation, acceptableTypes, recursiveUpdate }) => {
    let held = useContext(ObjectIsGrabbedContext)

    const [updater2, setUpdater2] = useState(0);

    // See if acceptable types is an object and not an array and handle it differently
    if (typeof acceptableTypes === "object" && !Array.isArray(acceptableTypes) && value) {
      return (
        <div className={styles.filterArgument}>
          <h3>{key}:</h3>
          <div>
            {
              Object.keys(value).map((key) => {
                return <TypedArgument
                  key={key + updater2}
                  $key={key}
                  value={value![key as keyof typeof value]}
                  object={value as Action["args"] | Action["returns"] | Filter["filter"] | Condition}
                  type={type}
                  setUpdater={setUpdater2}
                  orientation={orientation}
                  recursiveUpdate={recursiveUpdate}
                  acceptableTypes={(acceptableTypes as Record<string, AcceptableTypesArray>)[key]}
                />
              })}
          </div>


        </div>

      )
    }

    // handle an error
    if (!Array.isArray(acceptableTypes)) return (
      <div>
        <h1>TypedNodeProperties IS MISSING AN ENTRY FOR {type} Key:{key}</h1>
        <Button color="error" auto onPress={() => {
          // @ts-ignore
          delete object[key]
          setUpdater(current => current + 1)
        }} >
          Delete Key
        </Button>
      </div>
    );


    let allowedInputTypes = getAllowedInputTypes(acceptableTypes as string[])

    if (allowedInputTypes.multipleAllowed && !isArray(value)) {
      // @ts-ignore
      object[key] = [value]
      // @ts-ignore
      value = object[key] as string | Filter | (string | Filter)[] | undefined;
    }





    if (isArray(value)) {
      return (
        <div className={styles.filterArgument}>
          <h3>{key}:</h3>
          <div className={orientation == "horizontal" ? styles.rowList : styles.columnList}>

            {
              value.map((innerValue, index) => {
                return <>
                  <DropPosition config={{
                    type: allowedInputTypes.nodeTypes,
                    activeStyle: {
                      marginTop: "10px",
                      marginBottom: "10px",
                    },
                    inactiveStyle: {
                      marginTop: "5px",
                      marginBottom: "5px",
                      width: "100%",
                    },
                  }} onDrop={(grabbedObject) => {
                    // @ts-ignore
                    (value as (string | Filter | Action)[]).splice(index, 0, grabbedObject.data);
                    console.log("Dropped", grabbedObject, value)

                    setUpdater((current: number) => current + 1)
                    setUpdater2((current: number) => current + 1)
                    return true;
                  }} disable={held} />
                  <ActualResolvedValue
                    value={innerValue}
                    allowedInputTypes={allowedInputTypes}
                    setValue={(newValue) => {
                      console.log("Setting value", newValue)
                      if (newValue === undefined) {
                        value.splice(index, 1)
                      } else {
                        value[index] = newValue
                      }
                      console.log("Setting value", value)
                      setUpdater((current: number) => current + 1)
                      setUpdater2((current: number) => current + 1)
                    }}
                  />

                </>

              })}

            <DropPosition config={{ type: allowedInputTypes.nodeTypes }}
              onDrop={(grabbedObject) => {
                // @ts-ignore
                (value as (string | Filter | Action)[]).splice(0, 0, grabbedObject.data);
                console.log("Dropped", grabbedObject, value)

                setUpdater((current: number) => current + 1)
                setUpdater2((current: number) => current + 1)
                return true;
              }} disable={held}
            >
              <Button>
                Add
              </Button>
            </DropPosition>

          </div>
        </div>
      )
    }

    // @ts-ignore
    // value = object[key] as string | Filter | Filter[] | undefined;



    // if ((isArray(value) && value) || allowedInputTypes.multipleAllowed) {
    //   if (!(isArray(value) && value)) {
    //     // @ts-ignore
    //     object[key] = []
    //     // @ts-ignore
    //     value = object[key]
    //   }
    //   value = value as Filter[]
    //   return (
    //     <div className={styles.rowList}>
    //       <h3>{key}:</h3>
    //       <div className={orientation == "horizontal" ? styles.rowList : styles.columnList}>

    //         <DropPosition config={{ type: actualTypes }} onDrop={(grabbedObject) => {
    //           // @ts-ignore
    //           (value as (string | Filter | Action)[]).splice(0, 0, grabbedObject.data);
    //           console.log("Dropped", grabbedObject, value)

    //           setUpdater((current: number) => current + 1)
    //           setUpdater2((current: number) => current + 1)
    //           return true;
    //         }} disable={held} />

    //         {
    //           value.map((a, i) => (
    //             <ResolveGrabbedNode
    //               allowedDropTypes={actualTypes}
    //               // @ts-ignore
    //               data={a}
    //               i={i}
    //               object={object}
    //               $key={key}
    //               held={held}
    //               setUpdater={setUpdater2}
    //               key={Object.uniqueID(a) + updater2}
    //             />
    //           )
    //           )


    //         }

    //       </div>



    //     </div>

    //   )

    // }
    return (
      <div className={styles.filterArgument}>
        <h3>{key}:</h3>
        <ActualResolvedValue
          value={value}
          allowedInputTypes={allowedInputTypes}
          setValue={(newValue) => {
            console.log(object, key, newValue)
            // @ts-ignore
            if (object[key] != newValue) {
              setUpdater((current: number) => current + 1)
            }
            // @ts-ignore
            object[key] = newValue

            // TODO: FIX this
            // setUpdater((current: number) => current + 1)
            // setUpdater2((current: number) => current + 1)

          }}
        />
      </div>
    )






    // if (allowedInputTypes.nodeAllowed) {
    //   return (

    //     <div className={styles.filterArgument}>
    //       <h3>{key}:</h3>
    //       <DropPosition config={{ type: allowedInputTypes.nodeTypes }}

    //         onDrop={(grabbedObject) => {
    //           // @ts-ignore
    //           object[key] = grabbedObject.data;
    //           setUpdater(current => current + 1)
    //           return true;
    //         }} disable={held} key={value} >
    //         <div onClick={(e) => {
    //           e.stopPropagation();
    //         }} onMouseDown={(e) => {
    //           e.stopPropagation();
    //         }}  >
    //         </div>
    //       </DropPosition>


    //     </div>
    //   )

    // }

    // return <h1>ERROR typeof value: {typeof value}, acceptableTypes: {JSON.stringify(acceptableTypes)}</h1>
  });
TypedArgument.displayName = "FilterArgument";

