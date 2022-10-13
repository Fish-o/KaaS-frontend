import { Input } from "@nextui-org/react";
import { useContext, useState, useMemo, Dispatch, SetStateAction, useRef, useEffect } from "react";
import { Action } from "../../../lib/game/Actions";
import { Filter } from "../../../lib/game/Filters";
import { GrabbedObjectContext, ObjectIsGrabbedContext, SetDraggableNodeObjects } from "../../gameCreator";
import { TypedActionReturns, TypedNodeProperties } from "../../TypedNodeProperties"
import styles from "../../../styles/gameCreator.module.scss";
import { ActionLogicIf, LogicAction } from "../../../lib/game/Actions/logic";
import { recurseResolve } from "./FilterNode";
import { TypedArgument, AcceptableTypesArray } from "../typedNode";
import { Condition } from "../../../lib/game/Conditions";
import useStateRef from "react-usestateref";
import { NodeOptions } from "../NodeOptions";





export const ActionNode: React.FC<{ action: Action }> = ({ action }) => {

  let held = useContext(ObjectIsGrabbedContext)
  if (!action.args) {
    action.args = {}
  }
  if (!action.returns) {
    action.returns = {}
  }
  const [args, setArgs, argsRef] = useStateRef<typeof action.args>(action.args);
  useEffect(() => {
    action.args = args;
  }, [args, action]);
  const grabbedObject = useContext(GrabbedObjectContext);

  useEffect(() => {
    if (grabbedObject) {
      setArgs((args) =>
        recurseResolve(TypedNodeProperties[action.type], args, grabbedObject, held)
      );
    }
  }, [grabbedObject, held, action.type, setArgs, argsRef])


  const { name, description } = getActionInfo(action.type);

  return useMemo(() => {

    if (action.type === "action:logic.if") {
      return <IfNode args={argsRef.current as ActionLogicIf["args"]} setArgs={setArgs} />
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
          {Object.entries(argsRef.current).map(([key, value], index) => {
            return <TypedArgument
              value={value}
              $key={key}
              setValue={(newValue) => {
                setArgs((args) => ({ ...args, [key]: newValue }))
              }}
              key={key}
              acceptableTypes={TypedNodeProperties[action.type][key as (keyof typeof action.args)]}
            />
          })
          }
        </div>
        <NodeOptions node={action} />
        <VariablePart action={action} type={action.type} />


      </div >
    )

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, action.args, description, grabbedObject?.data.type, held, name])

};
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

const VariablePart: React.FC<{ action: Action, type: Action["type"] }> = ({ action, type }) => {
  const [returns, setReturns, returnsRef] = useStateRef<typeof action.returns>(action.returns);
  useEffect(() => {
    action.returns = returns;
  }, [returns, action]);

  useEffect(() => {
    Object.entries(TypedActionReturns[type]).forEach(([key,]) => {
      //@ts-ignore
      let possibleTypes = TypedActionReturns[type][key] as string[];

      if (Array.isArray(possibleTypes)) {
        if (possibleTypes.includes("variable")) {
          //@ts-ignore
          if (!returns[key]) {
            //@ts-ignore
            returns[key] = undefined
          }
        }
      }

      setReturns(returns)
    })
  }, [type, returns, setReturns])



  if (!returnsRef.current) return null

  return (
    <>
      <h2>Variable</h2>
      {Object.entries(returnsRef.current).map(([key, value], index) => {
        return <TypedArgument
          value={value}
          $key={key}
          setValue={(newValue) => {
            setReturns((returns) => ({ ...returns, [key]: newValue }))
          }}
          key={key}
          acceptableTypes={TypedActionReturns[type][key as keyof typeof returnsRef.current] as AcceptableTypesArray}
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