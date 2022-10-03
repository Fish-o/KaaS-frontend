import { Button } from "@nextui-org/react";
import React, { Dispatch, SetStateAction, memo, useContext } from "react";
import useState from 'react-usestateref';
import { Action } from "../../lib/game/Actions";
import { EventObject } from "../../lib/game/Events";
import { Filter } from "../../lib/game/Filters";
import exampleGame from "../../lib/games/example";
import { ObjectTypes, SetDraggableContext, SetDraggableNodeObjects, TypedNodeProperties } from "../gameCreator";
import styles from "../../styles/gameCreator.module.scss";
import DraggableObject from "./draggableObject";
import { ResolveNodeType } from "./resolveNodeType";
import { Condition } from "../../lib/game/Conditions";
import { GameObject } from "../../lib/game/Resolvers";
import { MethodObject } from "../../lib/game/Method";

import { GrabbedObject } from "../gameCreator"

function startsWith<Prefix extends string>(prefix: Prefix, val: string): val is `${Prefix}${string}` {
  return val.startsWith(prefix);
}



// GetValidDraggableObject("action:find.cards")

function GetValidDraggableObject<T extends (Action | Filter | Condition)["type"]>(type: T): Extract<(Action | Filter | Condition), { type: T }> {
  // if (startsWith("filter:", type)) {
  //   return {
  //     type: type,
  //     filter: {

  //     }
  //   }
  let defaultObject = {} as { [key: string]: any }


  if (TypedNodeProperties[type]) {
    let TypeInfo = TypedNodeProperties[type]
    // @ts-ignore
    Object.entries(TypeInfo).forEach(([key, value]: [string, string[]]) => {
      if (Array.isArray(value)) {
        if (value.includes("required")) {
          if (value.includes("array")) {
            defaultObject[key] = new Array()
            return
          }
          if (value.includes("number")) {
            defaultObject[key] = 0
            return
          }
          let literalStrings = value.filter((val) => val.startsWith('string:'))
          if (literalStrings.length > 0) {
            defaultObject[key] = literalStrings[0].replace('string:', '')
            return
          }
          if (value.includes("variable")) {
            defaultObject[key] = undefined
            return

          }
          if (value.includes("string")) {
            defaultObject[key] = undefined
            return
          }
          defaultObject[key] = "{UNKNOWN}"


        }
      }
    }
    )
  }
  if (startsWith("action:", type)) {
    return {
      type: type,
      args: defaultObject,
    } as any
  }
  if (startsWith("event:", type)) {
    return {
      type: type,
    } as any
  }

  if (startsWith("condition:", type)) {
    return {
      ...defaultObject,
      type: type,
    } as any
  }

  if (startsWith("filter:", type)) {
    return {
      type: type,
      filter: defaultObject
    } as any
  }

  throw new Error("Invalid type")
}








const GrabNewObject: React.FC<{ setGrabNewObject: Dispatch<SetStateAction<boolean>> }> = ({ setGrabNewObject }) => {
  return (

    <div className={styles.pickNewNode + " " + styles.rowList}>

      {
        // @ts-ignore
        Object.entries(TypedNodeProperties).map(([key, _]: [keyof typeof TypedNodeProperties, unknown]) => {

          return (
            <div key={key}>
              <DraggableObject fillData={GetValidDraggableObject(key)} onGrab={() => {
                setGrabNewObject(false)
              }}>
                <ResolveNodeType objectData={GetValidDraggableObject(key)} />

              </DraggableObject>
            </div>
          )


        })

      }
    </div >
  )
}

const TopMenuBar: React.FC<{ gameSettings: GameObject }> = ({ gameSettings }) => {

  const [grabNewObject, setGrabNewObject] = useState(false);
  const setDraggableNodeObjects = useContext(SetDraggableNodeObjects)


  return (
    <div className={styles.topBar}>

      <Button onClick={() => {


        let text = JSON.stringify(gameSettings, null, 2);
        // //save the JSON file to the users computer
        // var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        // saveAs(blob, "game.json");
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
        // //save the JSON file to the users computer
        // var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        // saveAs(blob, "game.json");
        localStorage.setItem("gameSettings", text);

        console.log("Saved to local storage", gameSettings)

      }}>Click to save gamemode</Button>
      <Button onClick={() => {
        setGrabNewObject(value => !value);
      }}>Click to add a new node!</Button>
      {grabNewObject ? <GrabNewObject setGrabNewObject={setGrabNewObject} /> : null}
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
    </div>
  );
};

export default TopMenuBar;


