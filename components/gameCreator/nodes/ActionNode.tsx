import { Input } from "@nextui-org/react";
import { useContext, useState, useMemo, Dispatch, SetStateAction, useRef, useEffect, memo } from "react";
import { Action } from "../../../lib/game/Actions";
import { Filter } from "../../../lib/game/Filters";
import { GrabbedObjectContext, GrabbedObjectTypeContext, NodableObjectTypes, ObjectDatas, ObjectIsGrabbedContext, ObjectTypes, SetDraggableNodeObjects } from "../../gameCreator";
import { TypedActionReturns, TypedNodeProperties } from "../../TypedNodeProperties"
import styles from "../../../styles/gameCreator.module.scss";
import { ActionLogicIf, LogicAction } from "../../../lib/game/Actions/logic";
import { recurseResolve } from "./FilterNode";
import { TypedArgument, AcceptableTypesArray } from "../typedNode";
import { Condition } from "../../../lib/game/Conditions";
import useStateRef from "react-usestateref";
import { NodeOptions } from "../NodeOptions";
import { NodeData } from "../NodeData";



export const ActionResolver: React.FC<{ action: Action }> = ({ action }) => {
  const type = action.type

  if (!action.args) {
    action.args = {}
  }
  const [args, setArgs, argsRef] = useStateRef<typeof action.args>(action.args);
  useEffect(() => {
    action.args = args;
  }, [args, action]);



  if (!action.returns) {
    action.returns = {}
  }
  const [returns, setReturns, returnsRef] = useStateRef<typeof action.returns>(action.returns);
  useEffect(() => {
    action.returns = returns;
  }, [returns, action]);



  const grabbedObjectType = useContext(GrabbedObjectTypeContext);
  useEffect(() => {
    if (grabbedObjectType) {
      setArgs((args) =>
        recurseResolve(TypedNodeProperties[type], args, grabbedObjectType)
      );
    }
  }, [grabbedObjectType, type, setArgs, argsRef])


  return useMemo(() => {
    const { name, description } = getActionInfo(type);

    if (!TypedNodeProperties[type]) {
      return <div>Unknown action type: {type}</div>;
    }
    if (type === "action:logic.if") {
      return <IfNode args={argsRef.current as ActionLogicIf["args"]} setArgs={setArgs} />
    }
    return (
      <div className={styles.actionNode} >

        <div>
          <h1> {name} </h1>
          <p>{description}</p>
        </div>
        <div className={styles.rowList}>
          < NodeData type={type} data={args} setData={setArgs} TypedDataObject={TypedNodeProperties} preferredOrder={[""]} />
          < NodeData type={type} data={returns} setData={setReturns} TypedDataObject={TypedActionReturns} prefix={"Returns"} />
        </div>
      </div>
    )
  }, [type, args, argsRef, returns, setArgs, setReturns])

}

const IfNode: React.FC<{ args: ActionLogicIf["args"], setArgs: Dispatch<SetStateAction<ActionLogicIf["args"]>> }> = ({ args, setArgs }) => {
  let held = useContext(ObjectIsGrabbedContext)
  const type = "action:logic.if"
  const { name, description } = getActionInfo(type);
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
            value={args.condition}
            $key={"condition"}
            setValue={(newValue) => {
              setArgs({ ...args, condition: newValue as Condition })
            }}
            acceptableTypes={TypedNodeProperties[type]["condition"]}
          />

        </div>

        <div className={styles.rowList}>
          <div className={styles.actionNode}>

            <TypedArgument
              value={args.true_actions}
              $key={"true_actions"}
              setValue={(newValue) => {
                setArgs({ ...args, true_actions: newValue as Action[] })

              }}
              acceptableTypes={TypedNodeProperties[type]["true_actions"]}
            />
          </div>
          <div className={styles.actionNode}>

            <TypedArgument
              value={args.false_actions}
              $key={"false_actions"}
              setValue={(newValue) => {
                setArgs({ ...args, false_actions: newValue as Action[] })
              }}
              acceptableTypes={TypedNodeProperties[type]["false_actions"]}
            />
          </div>
        </div>
      </div>

    </div >
  )
};

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

    case "action:user_input":
      return {
        name: "User input",
        description: "Get a users input",
      }

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