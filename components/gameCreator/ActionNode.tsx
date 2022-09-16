import { Input } from "@nextui-org/react";
import { useContext, useState, useMemo } from "react";
import { Action } from "../../lib/game/Actions";
import { Filter } from "../../lib/game/Filters";
import { GrabbedObjectContext, SetDraggableNodeObjects, TypedArgument, TypedNodeProperties } from "../gameCreator";
import styles from "../../styles/gameCreator.module.scss";
import { ActionLogicIf, LogicAction } from "../../lib/game/Actions/logic";


type InitializeType<T> = {} & {
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
  const { type, args, returns } = getPrototype(action);
  const { name, description } = getActionInfo(type);
  const setDraggableNodeObjects = useContext(SetDraggableNodeObjects)
  const grabbedObject = useContext(GrabbedObjectContext);

  const [updater, setUpdater] = useState(0)
  // const [draggableContext, setDraggableContext] = useContext(DraggableContext)

  return useMemo(() => {

    if (!action.args) {
      action.args = {}
    }
    if (grabbedObject && !held) {
      Object.entries(TypedNodeProperties[action.type]).forEach(([key,]) => {
        //@ts-ignore
        let possibleTypes = TypedNodeProperties[action.type][key] as string[];

        if (Array.isArray(possibleTypes)) {
          if (possibleTypes.some((possibleType) => grabbedObject.data.type.startsWith(possibleType))) {
            //@ts-ignore
            if (!action.args[key]) {
              //@ts-ignore
              action.args[key] = "<Placeholder>"
            }
          }
        }
      })
    }
    else {
      Object.entries(action.args).forEach(([key, value]) => {
        if (value === "<Placeholder>") {
          //@ts-ignore
          delete action.args[key]
        }
      })
    }
    if (action.type === "action:logic.if") {
      const logicIf = action as ActionLogicIf
      return <IfNode action={logicIf} rootHeld={rootHeld} held={held} />
    }

    return (
      <div className={styles.actionNode}>
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
          {Object.entries(args).map(([key, value], index) => {
            return <TypedArgument value={value} $key={key} object={args} type={action.type} held={held} setUpdater={setUpdater} key={key + updater} />
          })
          }
        </div>
        <VariablePart data={action.returns} />
      </div >
    )

  }, [updater, action, args, description, grabbedObject?.data.type, held, name, rootHeld])

};
const IfNode: React.FC<{ action: ActionLogicIf, rootHeld?: boolean, held?: boolean }> = ({ action, rootHeld = false, held = false }) => {
  held = held || rootHeld
  const { type, args, returns } = getPrototype(action);
  const { name, description } = getActionInfo(type);
  const setDraggableNodeObjects = useContext(SetDraggableNodeObjects)
  const [, setUpdater] = useState(0)
  // const [draggableContext, setDraggableContext] = useContext(DraggableContext)


  return (
    <div className={styles.actionNode}>
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
          <TypedArgument value={action.args.condition} $key={"condition"} object={args} type={action.type} held={held} setUpdater={setUpdater} key={"condition"} />

        </div>

        <div className={styles.rowList}>
          <div className={styles.actionNode}>

            <TypedArgument value={action.args.true_actions} $key={"true_actions"} object={args} type={action.type} held={held} setUpdater={setUpdater} key={"condition"} />
          </div>
          <div className={styles.actionNode}>

            <TypedArgument value={action.args.false_actions} $key={"false_actions"} object={args} type={action.type} held={held} setUpdater={setUpdater} key={"condition"} />
          </div>
        </div>
      </div>

    </div >
  )
};

const VariablePart: React.FC<{ data: Action["returns"] }> = ({ data }) => {
  if (!data) {
    return null
  }
  return (
    <>
      <h2>Variable</h2>
      {
        Object.entries(data).map(([key, value]: any, index: any) => {
          return (
            <div
              key={`node-arg-${key}-${index}`}
              className={styles.actionArgument}
            >


              <>
                <p>
                  <b>{key}</b>:{" "}
                </p>
                <Input
                  value={value || typeof value}
                  aria-label={"Argument input"}
                />
              </>
              {/* </p> */}
              <p></p>
            </div>
          );
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
    case "action:deck.shuffle":
      return {
        name: "Shuffle deck",
        description: "Shuffle a deck",
      }
    default:
      // @ts-
      return {
        // @ts-ignore
        name: type,
        description: "{description}",
      };
  }
}