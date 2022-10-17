import { Button, FormElement, Input, useInput, Grid, Switch } from "@nextui-org/react";
import { isArray, isNumber } from "lodash";
import React, { memo, useContext, useEffect, useMemo, useState } from "react";
import { Action } from "../../lib/game/Actions";
import { Condition } from "../../lib/game/Conditions";
import { Filter } from "../../lib/game/Filters";
import {
  DeleteSelfContext,
  getUniqueID,
  GrabbedObject,
  ObjectIsGrabbedContext,
  ObjectTypes,
} from "../gameCreator";
import DropPosition from "./DropPosition";
import styles from "../../styles/gameCreator.module.scss";
import DraggableObject from "./draggableObject";
import { ResolveNodeType } from "./resolveNodeType";
import { EventObject } from "../../lib/game/Events";
import { MethodObject } from "../../lib/game/Method";

type DefaultTypes = string | { [key: string]: DefaultTypes } | undefined;
type AcceptableTypes =
  | "array"
  | "number"
  | "variable"
  | "required"
  | "boolean"
  | GrabbedObject["data"]["type"]
  | `string:${string}`
  | "action"
  | "condition";

export type AcceptableTypesArray =
  | AcceptableTypes[]
  | {
      [key: string]: AcceptableTypesArray;
    };

type AcceptableValueTypes =
  | string
  | number
  | boolean
  | ObjectTypes
  | AcceptableValueTypes[]
  | { [key: string]: AcceptableValueTypes }
  | undefined;

const ResolveGrabbedNode: React.FC<{
  data: ObjectTypes;
  i?: number;
  object: any;
  $key: string;
  held: boolean;
  allowedDropTypes: ObjectTypes["type"];
  setUpdater: React.Dispatch<React.SetStateAction<number>>;
}> = ({ data, i, object, $key, held, allowedDropTypes, setUpdater }) => {
  if (isNumber(i)) {
    return (
      <>
        <DraggableObject
          fillData={data}
          onGrab={(grabbedObject) => {
            if (isNumber(i)) {
              object[$key].splice(i, 1);
              setUpdater((current) => current + 1);
            }
          }}
        >
          <ResolveNodeType objectData={data} />
        </DraggableObject>
        <DropPosition
          onDrop={(grabbedObject) => {
            if (isNumber(i)) {
              object[$key].splice(i + 1, 0, grabbedObject.data);
              setUpdater((current) => current + 1);
              return true;
            }
            return false;
          }}
          disable={held}
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
            type: allowedDropTypes,
          }}
        />
      </>
    );
  }
  return (
    <DraggableObject
      fillData={data}
      onGrab={(grabbedObject) => {
        console.log("grabbedObject", grabbedObject);
        object[$key] = undefined;
        setUpdater((current) => current + 1);
      }}
    >
      <ResolveNodeType objectData={data} />
    </DraggableObject>
  );
};

const OddValuesConversionTable = {};

function EncodeOddValuesReadably(value: any) {
  if (value === "[Infinity]") {
    return "[Infinity]";
  }
  if (value === "[undefined]" || value === "") {
    return "[undefined]";
  }
  return undefined;
}

function EncodeValue(value: any) {
  if (
    value == "-1" ||
    value == "[Infinity]" ||
    value == "99999999" ||
    value == "Infinity"
  ) {
    return "[Infinity]";
  }
  if (value === "" || value === "[undefined]" || value === undefined) {
    return "[undefined]";
  }
  return value.toString();
}
function DecodeOddValues(value: string): any {
  if (
    value === "-1" ||
    value === "[Infinity]" ||
    value === "99999999" ||
    value === "Infinity"
  ) {
    return 99999999;
  }
  if (value === "" || value === "[undefined]" || value === undefined) {
    return undefined;
  }
  if (!isNaN(Number(value))) {
    return Number(value);
  }

  return value;
}

export const TypedInput: React.FC<{
  initialValue: string | number | undefined;
  defaultValue?: string;
  numberOnly: boolean;
  variablesAllowed: boolean;
  required: boolean;
  specificStringsAllowed: string[] | null;
  setValue: (arg0: string | number | undefined) => void;
}> = memo(
  ({
    initialValue,
    defaultValue,
    numberOnly: numberAllowed = false,
    variablesAllowed: varaibleAllowed = false,
    required = false,
    specificStringsAllowed,
    setValue,
  }) => {
    const {
      value,
      bindings,
      setValue: setInputValue,
    } = useInput(EncodeValue(initialValue));
    //

    const getVaraibleHelper = (
      value: string
    ): {
      status: "error" | "success" | "default" | "warning";
      helperText: string;
    } => {
      if (!value.startsWith("$")) {
        return {
          status: "error",
          helperText: "This field must be a variable. Variables start with a $",
        };
      }
      if (value.startsWith("$") && value.length == 1) {
        return {
          status: "error",
          helperText: "Variables must have more then 1 character",
        };
      }
      if (value.startsWith("$") && value.length < 5) {
        return {
          status: "warning",
          helperText: "Variables should be more then 3 characters",
        };
      }
      return {
        status: "default",
        helperText: "",
      };
    };

    const getHelper = (
      value: string
    ): {
      status: "error" | "success" | "default" | "warning" | "primary";
      helperText: string;
    } => {
      if (
        DecodeOddValues(value) == defaultValue &&
        defaultValue !== undefined
      ) {
        return {
          status: "primary",
          helperText: "",
        };
      }

      if (value == "" || value == "[undefined]") {
        if (required) {
          return {
            status: "error",
            helperText: "This field is required",
          };
        }
        return {
          status: "default",
          helperText: "",
        };
      }
      if ((numberAllowed && !isNaN(Number(value))) || value == "[Infinity]") {
        return {
          status: "default",
          helperText: "",
        };
      }
      if (numberAllowed && isNaN(Number(value)) && !varaibleAllowed) {
        return {
          status: "error",
          helperText: "This field must be a number",
        };
      }
      if (specificStringsAllowed && !specificStringsAllowed.includes(value)) {
        return {
          status: "error",
          helperText:
            "This field must be one of the following: " +
            JSON.stringify(specificStringsAllowed) +
            specificStringsAllowed.join(", "),
        };
      }

      if (varaibleAllowed && value != "") {
        return getVaraibleHelper(value);
      }

      return {
        status: "default",
        helperText: "",
      };
    };
    const onBlur = (e: React.FocusEvent<FormElement, Element>) => {
      let value = e.target.value;
      if (required && value == "" && defaultValue) {
        console.log("setting default value", defaultValue);
        setValue(defaultValue);
        setInputValue(defaultValue);
      }
      if (value == "" && !required) {
        setValue(undefined);
      }
    };

    const helper = useMemo(() => {
      const helper = getHelper(value);
      let newValue = EncodeValue(value);
      if (newValue === "[undefined]") {
        return {
          ...helper,
          value: "",
          placeholder: newValue,
        };
      }

      return {
        ...helper,
        value: newValue,
      };
      // eslint-disable-next-line react-hooks/exhaustive-depsimage.png
    }, [value]);

    useEffect(() => {
      const helper = getHelper(value);
      if (helper.status !== "error" && DecodeOddValues(value) !== undefined) {
        setValue(DecodeOddValues(value));
      }
    }, [value]);

    return (
      <div style={{"height":helper.helperText ? "3.8rem" : ""}}>

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
        onFocus={(e) => {
          e.target.select();
        }}
        onBlur={onBlur}
        
        />
        </div>
    );
  }
);
TypedInput.displayName = "TypedInput";

function getAllowedInputTypes(acceptableTypes: string[]) {
  let specificStringsAllowed: string[] | null = null;
  specificStringsAllowed = acceptableTypes
    .filter((type) => type.startsWith("string:"))
    .map((type) => type.replace("string:", ""))
    .filter((type) => type !== "");
  if (specificStringsAllowed.length == 0) {
    specificStringsAllowed = null;
  }

  return {
    isBoolean: acceptableTypes.includes("boolean"),
    multipleAllowed: acceptableTypes.includes("array"),
    stringsAllowed: acceptableTypes.includes("string:"),
    numbersAllowed: acceptableTypes.includes("number"),
    variablesAllowed: acceptableTypes.includes("variable"),
    required: acceptableTypes.includes("required"),
    nodeAllowed: acceptableTypes.some(
      (type) =>
        type.startsWith("filter") ||
        type.startsWith("action") ||
        type.startsWith("condition")
    ),

    nodeTypes: acceptableTypes.filter(
      (type) =>
        type.startsWith("filter") ||
        type.startsWith("action") ||
        type.startsWith("condition")
    ) as unknown as ObjectTypes["type"],
    specificStringsAllowed,
  };
}

export const ActualResolvedValue: React.FC<{
  value: any;
  defaultValue?: string;
  allowedInputTypes: any;
  setValue: (arg0: any) => void;
  noDropPosition?: boolean;
}> = ({
  value,
  allowedInputTypes,
  setValue,
  noDropPosition = false,
  defaultValue,
}) => {
  if (typeof value === "object") {
    return (
      <div className={styles.filterValue}>
        <DeleteSelfContext.Provider
        value={() => {
          setValue(undefined);
        }}
        >
          <DraggableObject
            fillData={value}
            onGrab={() => {
              setValue(undefined);
            }}
          >
            <>
              {JSON.stringify(value)}
              <ResolveNodeType objectData={value} />
            </>
          </DraggableObject>
        </DeleteSelfContext.Provider>
      </div>
      
    );
  }

  if (
    allowedInputTypes.stringsAllowed ||
    allowedInputTypes.variablesAllowed ||
    allowedInputTypes.specificStringsAllowed ||
    allowedInputTypes.numbersAllowed
  ) {
    return (
      <>
        {noDropPosition ? null : (
          <DropPosition
            config={{ type: allowedInputTypes.nodeTypes }}
            onDrop={(grabbedObject) => {
              // @ts-ignore
              setValue(grabbedObject.data);
              return true;
            }}
            disable={true}
            key={value}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
            ></div>
          </DropPosition>
        )}

        <TypedInput
          numberOnly={allowedInputTypes.numbersAllowed}
          required={allowedInputTypes.required}
          variablesAllowed={allowedInputTypes.variablesAllowed}
          specificStringsAllowed={allowedInputTypes.specificStringsAllowed}
          initialValue={value}
          defaultValue={defaultValue}
          setValue={(value) => {
            console.log("setting value 2", value);
            setValue(value);
          }}
        />
      </>
    );
  }

  if (allowedInputTypes.nodeAllowed) {
    return (
      <DropPosition
        config={{ type: allowedInputTypes.nodeTypes }}
        onDrop={(grabbedObject) => {
          console.log("dropped", grabbedObject);
          debugger;
          // @ts-ignore
          setValue(grabbedObject.data);
          return true;
        }}
        disable={true}
        key={value}
      >
        <Input 
          value={"[" + allowedInputTypes.nodeTypes.join(",") + "]"} 
          readOnly 
          status={allowedInputTypes.required ? "error" : "primary"}  
          />
      </DropPosition>
    );
  }
  if (allowedInputTypes.isBoolean) {
    return (
      <Switch
        initialChecked={value}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onChange={(e) => {
          setValue(e.target.checked);
        }}
      />
    );
  }

  return (
    <h1>
      ERROR typeof value: {typeof value}, acceptableTypes:{" "}
      {JSON.stringify(allowedInputTypes)}
      <Button
        color="error"
        onClick={() => {
          setValue(undefined);
        }}
      >
        Delete
      </Button>
    </h1>
  );
};

// TODO Refactor this completely
export const TypedArgument: React.FC<{
  $key: string | number;
  // object: Exclude<Action["args"] | Action["returns"] | Filter["filter"] | Condition, undefined>,
  // type: (Action | Filter | Condition)["type"],

  value: AcceptableValueTypes | undefined;
  // setValue: ((arg0: AcceptableValueTypes) => AcceptableValueTypes),
  setValue: (arg0: AcceptableValueTypes | undefined) => void;

  // setUpdater: React.Dispatch<React.SetStateAction<number>>,
  orientation?: "horizontal" | "vertical";
  acceptableTypes: AcceptableTypesArray;
  defaultValue?: DefaultTypes;
  recursiveUpdate?: number;
}> = memo(
  ({
    $key: key,
    value,
    setValue,
    orientation,
    acceptableTypes,
    recursiveUpdate,
    defaultValue,
  }) => {
    let held = useContext(ObjectIsGrabbedContext);

    return useMemo(() => {
      if (
        typeof acceptableTypes === "object" &&
        !Array.isArray(acceptableTypes) &&
        value
      ) {
        return (
          <div className={styles.filterArgument}>
            <h3 className={styles.filterKey}>{key}:</h3>
            <div>
              {Object.keys(value).map((key) => {
                return (
                  <TypedArgument
                    key={key}
                    $key={key}
                    value={value[key as keyof typeof value]}
                    setValue={(newValue) => {
                      // @ts-ignore
                      setValue({ ...value, [key]: newValue });
                    }}
                    orientation={orientation}
                    recursiveUpdate={recursiveUpdate}
                    acceptableTypes={
                      (acceptableTypes as Record<string, AcceptableTypesArray>)[
                        key
                      ]
                    }
                    defaultValue={
                      ((defaultValue as Record<string, DefaultTypes>) ?? {})[
                        key
                      ]
                    }
                  />
                );
              })}
            </div>
          </div>
        );
      }

      // handle an error
      if (!Array.isArray(acceptableTypes))
        return (
          <div>
            <h1>
              TypedNodeProperties IS MISSING AN ENTRY FOR Key{" "}
              {JSON.stringify(value)}:{key}
            </h1>
            <Button
              color="error"
              auto
              onPress={() => {
                setValue("__$$DELETE$$__");
                // setUpdater(current => current + 1)
              }}
            >
              Delete Key
            </Button>
          </div>
        );

      let allowedInputTypes = getAllowedInputTypes(acceptableTypes as string[]);

      if (isArray(value)) {
        let CoolAddbutton =
          allowedInputTypes.stringsAllowed ||
          allowedInputTypes.variablesAllowed;
        let showAddButton = value[value.length - 1] !== undefined || value.length === 0;
        return (
          <div className={styles.filterArgument}>
            <h3 className={styles.filterKey}>{key}:</h3>
            <div
              className={
                orientation == "horizontal" ? styles.rowList : styles.columnList +" "
                + styles.filterValue
              }
            >
              {value.map((innerValue, index, array) => {
                let numOfObjects = array.filter(
                  (a) => typeof a == "object"
                ).length;
                let id = `${key}-${index}-${numOfObjects}`;
                if (
                  typeof innerValue === "object" &&
                  innerValue !== null &&
                  !Array.isArray(innerValue)
                ) {
                  // @ts-ignore
                  id = getUniqueID(innerValue);
                }

                return (
                  <>
                    <DropPosition
                      config={{
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
                      }}
                      onDrop={(grabbedObject) => {
                        if (!isArray(value)) setValue([grabbedObject.data]);
                        value.splice(index, 0, grabbedObject.data);
                        setValue([...value]);
                        console.log("Dropped", grabbedObject, value);
                        return true;
                      }}
                      disable={held}
                      key={`dp_${id}`}
                    />
                    <div
                      onMouseLeave={() => {
                        if (
                          index === value.length - 1 &&
                          innerValue === undefined
                        ) {
                          value.splice(index, 1);
                          setValue([...value]);
                        }
                      }}
                    >
                      <ActualResolvedValue
                        value={innerValue}
                        allowedInputTypes={{
                          ...allowedInputTypes,
                          required: false,
                        }}
                        setValue={(newValue) => {
                          console.log(
                            "Setting value",
                            newValue,
                            [...value],
                            index
                          );

                          if (!isArray(value)) setValue([newValue]);
                          if (newValue == undefined) {
                            if (index === value.length - 1) {
                              if (!CoolAddbutton) {
                                value.splice(index, 1);
                              } else {
                                value[index] = newValue;
                              }
                            } else {
                              value.splice(index, 1);
                            }
                          } else {
                            value[index] = newValue;
                          }
                          setValue([...value]);
                          console.log("Setting value", [...value]);
                        }}
                        noDropPosition={true}
                        key={`arv_${id}`}
                      />
                    </div>
                  </>
                );
              })}

              <DropPosition
                config={{
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
                }}
                onDrop={(grabbedObject) => {
                  console.log("Dropped", grabbedObject, value);
                  if (!isArray(value)) setValue([grabbedObject.data]);
                  value.splice(value.length, 0, grabbedObject.data);
                  setValue([...value]);
                  return true;
                }}
                disable={held}
                key={`dp_${value.length}_${showAddButton}`}
              >
                <>
                {showAddButton && CoolAddbutton ? (
                  <>
                    <div
                      style={{
                        height: "10px",
                      }}
                    />
                    <Button
                      onMouseOver={(e) => {
                        if (!isArray(value)) setValue([undefined]);
                        if (
                          value[value.length - 1] !== undefined ||
                          value.length === 0
                        ) {
                          setValue([...value, undefined]);
                        }
                      }}
                    >
                      Add
                    </Button>
                  </>
                ) : undefined}
                {!CoolAddbutton && value.length === 0 ? (
                  <Input readOnly value="[Drag a node]" status="primary"/>)
                  : undefined
                }
                </>

              </DropPosition>
            </div>
          </div>
        );
      }
      return (
        <div className={styles.filterArgument}>
          <h3 className={styles.filterKey}>{key}:</h3>
          <div className={styles.filterValue}>

            <ActualResolvedValue
              value={value}
              allowedInputTypes={allowedInputTypes}
              defaultValue={defaultValue as string}
              setValue={setValue}
            />
          </div>
          
        </div>
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [acceptableTypes, value, key, orientation, recursiveUpdate, held]);
  }
);
TypedArgument.displayName = "FilterArgument";
TypedArgument.whyDidYouRender = true;
