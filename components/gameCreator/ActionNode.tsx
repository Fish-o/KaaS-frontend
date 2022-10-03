import { Input } from "@nextui-org/react";
import { useContext, useState, useMemo, Dispatch, SetStateAction, useRef, useEffect } from "react";
import { Action } from "../../lib/game/Actions";
import { Filter } from "../../lib/game/Filters";
import { AcceptableTypesArray, GrabbedObjectContext, SetDraggableNodeObjects, TypedActionReturns, TypedArgument, TypedNodeProperties } from "../gameCreator";
import styles from "../../styles/gameCreator.module.scss";
import { ActionLogicIf, LogicAction } from "../../lib/game/Actions/logic";
import { recurseResovlve as recursivelyResolveParameters } from "./FilterNode";


type InitializeType<T> = {
  [K in keyof T]-?: string extends T[K]
  ? ""
  : number extends T[K]
  ? 0
  : boolean extends T[K]
  ? false
  : Array<any> extends T[K]
  ? []
  : object extends T[K]
  ? {}
  : T[K];
};

function getPrototype<T>(t: T): InitializeType<T> {
  return t as InitializeType<T>;
}

export const ActionNode: React.FC<{ action: Action, rootHeld?: boolean, held?: boolean }> = ({ action, rootHeld = false, held = false }) => {
  held = held || rootHeld
  const { name, description } = getActionInfo(action.type);
  const grabbedObject = useContext(GrabbedObjectContext);

  const [updater, setUpdater] = useState(0)

  return useMemo(() => {
    if (!action.args) {
      action.args = {}
    }
    recursivelyResolveParameters(TypedNodeProperties[action.type], action.args, grabbedObject, held)



    if (action.type === "action:logic.if") {
      const logicIf = action as ActionLogicIf
      return <IfNode action={logicIf} rootHeld={rootHeld} held={held} />
    }

    return (
      <div className={styles.actionNode} style={held ? { border: "2px solid red" } : {}}>

        <div>
          <h1
            style={{
              textAlign: "center",
              padding: "0px",
              margin: "0px",
              marginTop: "10px",
            }}
          >
            {name}
          </h1>
          <p>{description}</p>
        </div>
        <div className={styles.rowList}>
          {Object.entries(action.args).map(([key, value], index) => {
            return <TypedArgument
              value={value}
              $key={key}
              object={action.args}
              type={action.type}
              held={held}
              setUpdater={setUpdater}
              key={key}
              acceptableTypes={TypedNodeProperties[action.type][key as (keyof typeof action.args)]}
            />
          })
          }
        </div>
        <VariablePart data={action} type={action.type} held={held} setUpdater={setUpdater} />
      </div >
    )

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updater, action, action.args, description, grabbedObject?.data.type, held, name, rootHeld])

};
const IfNode: React.FC<{ action: ActionLogicIf, rootHeld?: boolean, held?: boolean }> = ({ action, rootHeld = false, held = false }) => {
  held = held || rootHeld
  const { type, args } = getPrototype(action);
  const { name, description } = getActionInfo(type);
  const [, setUpdater] = useState(0)

  return (
    <div className={styles.actionNode} style={held ? { border: "2px solid red" } : {}}>
      <div className={styles.columnList}>
        <div className={styles.rowList}>
          <div>
            <h1
              style={{
                textAlign: "center",
                padding: "0px",
                margin: "0px",
                marginTop: "10px",
              }}
            >
              {name}
            </h1>
            <p>{description}</p>

          </div>
          <TypedArgument
            value={action.args.condition}
            $key={"condition"} object={args}
            type={action.type} held={held}
            setUpdater={setUpdater} key={"condition"}
            acceptableTypes={TypedNodeProperties[action.type]["condition"]}
          />

        </div>

        <div className={styles.rowList}>
          <div className={styles.actionNode}>

            <TypedArgument
              value={action.args.true_actions}
              $key={"true_actions"} object={args}
              type={action.type}
              held={held}
              setUpdater={setUpdater}
              key={"condition"}
              acceptableTypes={TypedNodeProperties[action.type]["true_actions"]}
            />
          </div>
          <div className={styles.actionNode}>

            <TypedArgument
              value={action.args.false_actions}
              $key={"false_actions"}
              object={args}
              type={action.type}
              held={held}
              setUpdater={setUpdater}
              key={"condition"}
              acceptableTypes={TypedNodeProperties[action.type]["false_actions"]}
            />
          </div>
        </div>
      </div>

    </div >
  )
};

const VariablePart: React.FC<{ data: Action, type: Action["type"], held: boolean, setUpdater: Dispatch<SetStateAction<number>> }> = ({ data, type, held, setUpdater }) => {
  const [updater2, setUpdater2] = useState(0)
  useEffect(() => {
    setUpdater((updater) => updater + 1)
  }, [updater2])

  let dataRef = useRef(data.returns)
  // useEffect(() => {
  //   if (dataRef.current === undefined) {
  //     dataRef.current = {}
  //   }
  // }, [])
  if (!dataRef.current) {
    dataRef.current = {}
  }
  if (!Object.values(dataRef.current).some((value) => value !== undefined)) {
    // If there is no useful information in the returns object, don't save it
    delete data.returns

    // if (Object.keys(data.returns).length === 0) {
    //   console.log("deleting returns", data.returns)
    //   delete data.returns
    // }
  } else {
    if (data.returns === undefined) {
      data.returns = dataRef.current
    }
  }


  Object.entries(TypedActionReturns[type]).forEach(([key,]) => {
    //@ts-ignore
    let possibleTypes = TypedActionReturns[type][key] as string[];

    if (Array.isArray(possibleTypes)) {
      if (possibleTypes.includes("variable")) {
        //@ts-ignore
        if (!dataRef.current[key]) {
          //@ts-ignore
          dataRef.current[key] = undefined
        }
      }
    }
  })
  return (
    <>
      <h2>Variable</h2>
      {Object.entries(dataRef.current).map(([key, value], index) => {
        return <TypedArgument
          value={value}
          $key={key}
          object={dataRef.current}
          type={type}
          held={held}
          setUpdater={setUpdater2}
          key={key}
          acceptableTypes={TypedActionReturns[type][key as keyof typeof dataRef.current] as AcceptableTypesArray}
        />
      })
      }
    </>
  )
}

function getActionInfo(type: Action["type"]): {
  name: string;
  description: string;
} {
  switch (type) {
    case "action:cards.move":
      return {
        name: "Move cards",
        description: "Move cards from one card holder to another",
      };




    case "action:logic.for_each":
      return {
        name: "For each",
        description: "Run a set of actions for each item that it found",
      };
    case "action:logic.if":
      return {
        name: "If",
        description: "Run a set of actions if the condition is true",
      };
    case "action:logic.return":
      return {
        name: "Return",
        description: "Stop execution and return a value",
      };
    case "action:logic.break":
      return {
        name: "Break",
        description: "Stop execution",
      };
    case "action:logic.loop":
      return {
        name: "Loop",
        description: "Run a set of actions in a loop",
      }


    case "action:find.cards":
      return {
        name: "Find cards",
        description: "Find cards in the game",
      };
    case "action:find.decks":
      return {
        name: "Find decks",
        description: "Find decks in the game",
      };
    case "action:find.players":
      return {
        name: "Find players",
        description: "Find players in the game",
      };
    case "action:find.hands":
      return {
        name: "Find hands",
        description: "Find hands of players in the game",
      };


    case "action:debug":
      return {
        name: "Debug",
        description: "Debug",
      };



    case "action:user_input.select_players":
      return {
        name: "Select players",
        description: "Prompt a user to select players",
      };
    case "action:user_input.select_cards":
      return {
        name: "Select cards",
        description: "Prompt a user to select cards",
      };






    case "action:deck.shuffle":
      return {
        name: "Shuffle deck",
        description: "Shuffle a deck",
      }
    case "action:deck.draw":
      return {
        name: "Draw cards",
        description: "Draw cards from a deck",
      }






    case "action:data.get":
      return {
        name: "Get data",
        description: "Get data from any game object",
      }
    case "action:data.set":
      return {
        name: "Set data",
        description: "Set data on any game object",
      }
    case "action:logic.method":
      return {
        name: "Method",
        description: "Invoke Method"
      }

    default:
      return {
        name: type,
        description: "{description}",
      } as never;
  }
}