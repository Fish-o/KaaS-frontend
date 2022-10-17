import { Button, Dropdown } from "@nextui-org/react";
import React, { Dispatch, SetStateAction, memo, useContext } from "react";
import useState from 'react-usestateref';
import { Action } from "../../lib/game/Actions";
import { EventObject } from "../../lib/game/Events";
import { Filter } from "../../lib/game/Filters";
import exampleGame from "../../lib/games/example";
import { ObjectTypes, SetDraggableContext, SetDraggableNodeObjects } from "../gameCreator";
import {
  ActionNodeProperties,
  ConditionNodeProperties,
  DefaultValueNodeProperties,
  FilterNodeProperties,
  InputNodeProperties,
} from "../TypedNodeProperties";
import styles from "../../styles/gameCreator.module.scss";
import DraggableObject from "./draggableObject";
import { ResolveNodeType } from "./resolveNodeType";
import { Condition } from "../../lib/game/Conditions";
import { GameObject } from "../../lib/game/Resolvers";
import { MethodObject } from "../../lib/game/Method";

import { GrabbedObject } from "../gameCreator";
import { games } from "../../lib/games";
import { UserInput } from "../../lib/game/Input";

function startsWith<Prefix extends string>(
  prefix: Prefix,
  val: string
): val is `${Prefix}${string}` {
  return val.startsWith(prefix);
}

type ValueOf<T> = T[keyof T];

function GetValidObject(type: any) {
  let defaultObject = {} as { [key: string]: any };

  Object.entries(type).forEach(([key, value]) => {
    if (!Array.isArray(value)) return;
    if (!value.includes("required")) return;

    if (value.includes("array")) {
      defaultObject[key] = new Array();
      return;
    }
    if (value.includes("number")) {
      defaultObject[key] = 0;
      return;
    }
    let literalStrings = value.filter((val) => val.startsWith("string:"));
    if (literalStrings.length > 0) {
      defaultObject[key] = literalStrings[0].replace("string:", "");
      return;
    }
    if (value.includes("variable")) {
      defaultObject[key] = undefined;
      return;
    }
    if (value.includes("string:")) {
      defaultObject[key] = undefined;
      return;
    }
    if (value.includes("boolean")) {
      defaultObject[key] = false;
      return;
    }
    defaultObject[key] = "{UNKNOWN}";
  });
  return defaultObject;
}

function MakeValidDraggableObject<
  T extends (Action | Filter | Condition | UserInput)["type"]
>(type: T): Extract<Action | Filter | Condition | UserInput, { type: T }> {
  if (startsWith("action:", type)) {
    if (!ActionNodeProperties[type]) throw new Error(`Invalid type ${type}`);
    let defaultObject = GetValidObject(ActionNodeProperties[type]);
    return {
      type: type,
      args: defaultObject,
    } as any;
  }
  if (startsWith("event:", type)) {
    return {
      type: type,
    } as any;
  }

  if (startsWith("condition:", type)) {
    if (!ConditionNodeProperties[type]) throw new Error(`Invalid type ${type}`);
    let defaultObject = GetValidObject(ConditionNodeProperties[type]);
    return {
      condition: defaultObject,
      type: type,
    } as any;
  }

  if (startsWith("filter:", type)) {
    if (!FilterNodeProperties[type]) throw new Error(`Invalid type ${type}`);
    let defaultObject = GetValidObject(FilterNodeProperties[type]);
    return {
      type: type,
      filter: defaultObject,
    } as any;
  }
  if (startsWith("input:", type)) {
    if (!InputNodeProperties[type]) throw new Error(`Invalid type ${type}`);
    let defaultObject = GetValidObject(InputNodeProperties[type]);
    return {
      type: type,
      filter: defaultObject,
    } as any;
  }

  throw new Error("Invalid type");
}

const GrabNewObjects: React.FC<{
  setGrabNewObject: Dispatch<SetStateAction<boolean>>;
  objects: any;
  name: string;
}> = ({ setGrabNewObject, objects, name }) => {
  const [open, setOpen] = useState<boolean>(false);

  if (open) {
    return (
      <div className={styles.columnList}>
        <Button onClick={() => setOpen(false)}>{name} </Button>
        <div>
          {
            // @ts-ignore
            (
              Object.entries(objects) as [
                [(Action | Filter | Condition | UserInput)["type"], unknown]
              ]
            ).map(([key, _]) => {
              return (
                <div key={key}>
                  <DraggableObject
                    fillData={MakeValidDraggableObject(key)}
                    onGrab={() => {
                      setGrabNewObject(false);
                    }}
                  >
                    <ResolveNodeType
                      objectData={MakeValidDraggableObject(key)}
                    />
                  </DraggableObject>
                </div>
              );
            })
          }
        </div>
      </div>
    );
  }
  return <Button onClick={() => setOpen(true)}>{name} </Button>;
};

const GrabNewObject: React.FC<{
  setGrabNewObject: Dispatch<SetStateAction<boolean>>;
}> = ({ setGrabNewObject }) => {
  console.log("Rendering GrabNewObject");
  return (
    <div className={styles.pickNewNode + " " + styles.columnList}>
      <GrabNewObjects
        setGrabNewObject={setGrabNewObject}
        objects={FilterNodeProperties}
        name={"Filters"}
      />
      <GrabNewObjects
        setGrabNewObject={setGrabNewObject}
        objects={ActionNodeProperties}
        name={"Actions"}
      />
      <GrabNewObjects
        setGrabNewObject={setGrabNewObject}
        objects={ConditionNodeProperties}
        name={"Conditions"}
      />
      <GrabNewObjects
        setGrabNewObject={setGrabNewObject}
        objects={InputNodeProperties}
        name={"Input"}
      />
    </div>
  );
};


const SelectNewGame: React.FC<{ selectGame: (arg0: GameObject) => void }> = ({ selectGame }) => {
  return (
    <div>
      {
        Object.entries(games).map(([key, value]) => {
          return (
            <Button key={key} onClick={() => {
              selectGame(value)
            }}>{key}</Button>
          )
        })
      }
    </div>
  )


}

const TopMenuBar: React.FC<{ gameSettings: GameObject }> = ({ gameSettings }) => {

  const [grabNewObject, setGrabNewObject] = useState(false);
  const [selectGame, setSelectGame] = useState(false);
  const setDraggableNodeObjects = useContext(SetDraggableNodeObjects)


  return (
    <>
      <div className={styles.topBar}>

        <Button onClick={() => {


          let text = JSON.stringify(gameSettings, null, 2);

          const name = prompt("What is the name of this gamemode?");
          if (name) {
            const element = document.createElement("a");
            const file = new Blob([text], { type: 'text/plain' });
            element.href = URL.createObjectURL(file);
            element.download = name + ".json";
            document.body.appendChild(element); // Required for this to work in FireFox
            element.click();
          }



        }}>Click to download gamemode</Button>
        <Button onClick={() => {


          let text = JSON.stringify(gameSettings);
          // save the JSON file to the users computer
          localStorage.setItem("gameSettings", text);

          console.log("Saved to local storage", gameSettings)

        }}>Click to save gamemode</Button>
        <Button onClick={() => {
          setGrabNewObject(value => !value);
        }}>Click to add a new node!</Button>
        <Button onClick={() => {
          let methodName = prompt("What is the name of this method?");
          let method: MethodObject
          if (methodName) {
            if (!gameSettings.methods) gameSettings.methods = []
            method = {
              type: "method:" + methodName as `method:${string}`,
              actions: []
            }
            gameSettings.methods.push(method)
          }
          setDraggableNodeObjects?.((current: GrabbedObject[]) => ([...current, {
            clientX: 0,
            clientY: 0,
            data: method,
            height: 0,
            width: 0,
            dontGrabImmediately: true,
            zindex: 0
          }]))
        }
        }>Click to add a new method</Button>
        <Button onClick={() => {
          setSelectGame(value => !value);
        }
        }>Click to load preset game</Button>
      </div>
      {grabNewObject ? <GrabNewObject setGrabNewObject={setGrabNewObject} /> : null}
      {selectGame ? <SelectNewGame selectGame={(game) => {
        let text = JSON.stringify(game);
        // save the JSON file to the users computer
        localStorage.setItem("gameSettings", text);

        console.log("Saved to local storage", game)
        setSelectGame(false)

        // reload
        window.location.reload();
      }} /> : null}

    </>

  );
};

export default TopMenuBar;


