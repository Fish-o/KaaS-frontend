import { Input } from "@nextui-org/react";
import { useId } from "react";
import { Action } from "../lib/game/Actions";
import { Filter } from "../lib/game/Filters";
import exampleGame from "../lib/games/example";
import styles from "../styles/gameCreator.module.scss";

export const GameCreator: React.FC = () => {
  const id = useId();
  return (
    <div className={styles.actionContainer}>
      {exampleGame.events.map((event) => {
        return (
          <div className={styles.eventNode}>
            <h1>EVENT: {event.type}</h1>
            {event.actions.map((a, i) => (
              <ActionNode action={a} key={`${id}-${i}`} />
            ))}
          </div>
        );
      })}
    </div>
  );
};

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

// declare function getPrototype<T>(): InitializeType<T>;

function getPrototype<T>(t: T): InitializeType<T> {
  return t as InitializeType<T>;
}

export const ActionNode: React.FC<{ action: Action }> = ({ action }) => {
  const { type, args, returns } = getPrototype(action);
  const { name, description } = getActionInfo(type);
  return (
    <div className={styles.actionNode}>
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
      <h4>Args:</h4>
      {Object.entries(args).map(([key, value], index) => {
        const entered: any = args[key as keyof typeof args];
        let filter: Filter | undefined = undefined;
        if (typeof entered === "object") {
          const enteredObj: Filter | Action[] = entered;
          if (Array.isArray(enteredObj)) {
          } else if (enteredObj.type.startsWith("filter:")) {
            filter = enteredObj;
          }
        }
        return (
          <div
            key={`node-arg-${key}-${index}`}
            className={styles.actionArgument}
          >
            <p>
              <b>{key}</b>:{" "}
              {filter ? (
                <FilterNode filter={filter} />
              ) : (
                <Input
                  value={entered || typeof value}
                  aria-label={"Argument input"}
                />
              )}
            </p>
            <p></p>
          </div>
        );
      })}
    </div>
  );
};

export const FilterNode: React.FC<{ filter: Filter }> = ({ filter }) => {
  return (
    <div className={styles.filterNode}>
      <h3>Filter: {filter.type}</h3>
      {JSON.stringify(filter.filter)}
    </div>
  );
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
    default:
      return {
        // @ts-ignore
        name: type,
        description: "{description}",
      };
  }
}
