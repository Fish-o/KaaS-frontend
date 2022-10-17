import { useContext, useEffect, useMemo } from "react";
import useStateRef from "react-usestateref";
import { Condition } from "../../../lib/game/Conditions";
import { UserInput } from "../../../lib/game/Input";
import { ObjectIsGrabbedContext } from "../../gameCreator";
import {
  DefaultValueNodeProperties,
  InputNodeProperties,
} from "../../TypedNodeProperties";
import { TypedArgument } from "../typedNode";
import { recurseResolve } from "./FilterNode";
import styles from "../../../styles/gameCreator.module.scss";

type ValueOF<T> = T[keyof T];

type Entries<T> = [keyof T, T[keyof T]][];

export const InputNode: React.FC<{ input: UserInput }> = ({ input }) => {
  let held = useContext(ObjectIsGrabbedContext);
  let type = input.type;
  if (!input.input) {
    // @ts-ignore
    input.input = {};
  }
  const [data, setData, dataRef] = useStateRef(input.input);
  useEffect(() => {
    input.input = data;
  }, [data, input]);

  useEffect(() => {
    setData((data) =>
      recurseResolve(
        InputNodeProperties[type],
        DefaultValueNodeProperties[type],
        data,
        null
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  return useMemo(() => {
    return (
      <div
        className={styles.inputNode}
        style={held ? { border: "2px solid red" } : {}}
      >
        <h1>Input: {type}</h1>

        <div>
          {(
            Object.entries(dataRef.current) as Entries<typeof dataRef.current>
          ).map(([key, value]) => {
            return (
              <TypedArgument
                key={key}
                $key={key}
                value={value}
                setValue={(newValue) => {
                  setData((oldValue) => {
                    if (newValue === undefined) {
                      delete oldValue[key];
                    } else {
                      // @ts-ignore
                      oldValue[key] = newValue;
                    }
                    return { ...oldValue };
                  });
                }}
                acceptableTypes={
                  InputNodeProperties[type][key as keyof typeof input.input]
                }
              />
            );
          })}
        </div>
      </div>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, held, data]);
};