import { Variable, VariableMap } from "../Actions";
import { BaseGameObject } from "../Objects";
import { Card } from "../Objects/Card";
import { Deck } from "../Objects/Deck";
import { Hand, Player } from "../Objects/Player";

export enum Operators {
  EQUAL = "=",
  GREATER_THAN = ">",
  LESS_THAN = "<",
  CONTAINS = "contains",
  STARTS_WITH = "starts_with",
}

export enum Field {
  // ID = "id",
  TAGS = "tags",
  AMOUNT = "amount",
  // HAND_CARDS = "hand.cards",
}
export interface BaseCondition {
  type: `condition:${string}`;
  operator: string;
  not?: boolean;
}

export type ObjectTypes = `deck` | `card` | `hand` | `player`;
/*
  Conditions
*/
type ObjectVariable = Variable;
type ArrayVariable = Variable;

interface MetaCondition extends BaseCondition {
  type: "condition:meta";
  operator: "and" | "or";
  conditions: Condition[];
}

export interface TagCondition extends BaseCondition {
  type: "condition:tags";
  a: ObjectVariable;
  operator: "contains";
  b: string;
}

export interface ObjectCondition extends BaseCondition {
  type: "condition:object";
  a: ObjectVariable;
  operator: "is" | "contains";
  b: ObjectVariable;
}

export interface ArrayCondition extends BaseCondition {
  type: "condition:array";
  a: ArrayVariable;
  operator: "contains";
  b: ObjectVariable;
}

export interface AmountCondition extends BaseCondition {
  type: "condition:amount";
  a: Variable;
  operator: "=" | ">" | "<";
  b: number | Variable;
}

export interface TypeCondition extends BaseCondition {
  type: "condition:type";
  a: Variable;
  operator: "is_type" | "contains_type";
  b: ObjectTypes | Variable;
}

export type Condition =
  | MetaCondition
  | TagCondition
  | ObjectCondition
  | ArrayCondition
  | AmountCondition
  | TypeCondition;

/*
  Performer
*/

// TODO: Make sure this still works, even with all types being arrays
export function performCondition(
  condition: Condition,
  variables: VariableMap
): boolean {
  let result: boolean | undefined = undefined;

  switch (condition.type) {
    case "condition:meta":
      if (condition.operator === "and")
        result = condition.conditions.every((c) =>
          performCondition(c, variables)
        );
      else if (condition.operator === "or")
        result = condition.conditions.some((c) =>
          performCondition(c, variables)
        );
      else throw new Error(`Unknown operator: ${condition.operator}`);
      if (typeof result !== "number")
        throw new Error("Invalid condition:base, must contain sub condition's");
      break;

    case "condition:tags":
      const variable = variables.get(condition.a);
      if (!variable) throw new Error(`Variable ${condition.a} not found`);
      else if (!(variable instanceof BaseGameObject))
        throw new Error(
          `Variable ${condition.a} is either a list or not a game object`
        );
      result = variable.hasTag(condition.b);
      break;

    case "condition:object":
      const variable_1 = variables.get(condition.a);
      const variable_2 = variables.get(condition.b);
      if (!variable_1) throw new Error(`Variable ${condition.a} not found`);
      else if (!variable_2)
        throw new Error(`Variable ${condition.b} not found`);
      if (
        !(variable_1 instanceof BaseGameObject) ||
        !(variable_2 instanceof BaseGameObject)
      )
        throw new Error(
          `Variable ${condition.a} and ${condition.b} must be both GameObjects`
        );
      switch (condition.operator) {
        case "is":
          result = variable_1 === variable_2 || variable_1.id === variable_2.id;
          break;
        case "contains":
          if (variable_1 instanceof Deck) {
            if (!(variable_2 instanceof Card))
              throw new Error(
                `Invalid condition:object, decks can only contain cards`
              );
            result = variable_1.contains(variable_2);
          } else if (variable_1 instanceof Hand) {
            if (!(variable_2 instanceof Card))
              throw new Error(
                `Invalid condition:object, hands can only contain cards`
              );
            result = variable_1.contains(variable_2);
          } else if (variable_1 instanceof Player) {
            if (!(variable_2 instanceof Hand))
              throw new Error(
                `Invalid condition:object, players can only contain hands`
              );
            result = variable_1.hand === variable_2;
          } else
            throw new Error(
              `Invalid condition:object, invalid type for variable ${condition.a}`
            );
          break;
      }
      break;

    case "condition:array": {
      const array = variables.get(condition.a);
      if (!array) throw new Error(`Variable ${condition.a} not found`);
      else if (!(array instanceof Array))
        throw new Error(`Variable ${condition.a} is not an array`);

      const variable = variables.get(condition.b);
      if (!variable) throw new Error(`Variable ${condition.b} not found`);
      switch (condition.operator) {
        case "contains":
          if (!(variable instanceof BaseGameObject))
            throw new Error(
              `Invalid condition:array, array can only contain game objects`
            );
          result = array.some((v) => v === variable);
          break;
      }
    }

    case "condition:amount": {
      const variable = variables.get(condition.a);
      if (!variable) throw new Error(`Variable ${condition.a} not found`);

      const amountToCheck = condition.b;
      if (typeof amountToCheck !== "number")
        throw new Error(`Invalid condition:amount, b must be a number`);
      let actualAmount: number;
      if (variable instanceof Deck) actualAmount = variable.cards.length;
      else if (variable instanceof Hand) actualAmount = variable.cards.length;
      else if (variable instanceof Array) actualAmount = variable.length;
      // else if (variable instanceof Player) actualAmount = variable.hands.length;
      else
        throw new Error(
          `Invalid condition:amount, variable ${condition.b} isn't a card container or array`
        );

      switch (condition.operator) {
        case "=":
          result = actualAmount === amountToCheck;
          break;
        case ">":
          result = actualAmount < amountToCheck;
          break;
        case "<":
          result = actualAmount < amountToCheck;
          break;
      }
      break;
    }

    case "condition:type": {
      const variable = variables.get(condition.a);
      if (!variable) throw new Error(`Variable ${condition.a} not found`);
      let typeToCheck: ObjectTypes;
      if (condition.b === "deck") typeToCheck = "deck";
      else if (condition.b === "hand") typeToCheck = "hand";
      else if (condition.b === "player") typeToCheck = "player";
      else if (condition.b === "card") typeToCheck = "card";
      else if (condition.b.startsWith("$")) {
        const typeToCheckVariable = variables.get(condition.b);
        if (!typeToCheckVariable)
          throw new Error(`Variable ${condition.b} not found`);
        else if (!(typeToCheckVariable instanceof BaseGameObject))
          throw new Error(`Variable ${condition.b} is not a valid object type`);
        else if (typeToCheckVariable instanceof Deck) typeToCheck = "deck";
        else if (typeToCheckVariable instanceof Hand) typeToCheck = "hand";
        else if (typeToCheckVariable instanceof Player) typeToCheck = "player";
        else if (typeToCheckVariable instanceof Card) typeToCheck = "card";
        else
          throw new Error(`Variable ${condition.b} is not a valid object type`);
      } else
        throw new Error(`Invalid condition:type, b must be or have a type`);

      switch (condition.operator) {
        case "is_type":
          if (variable instanceof BaseGameObject) {
            if (typeToCheck === "deck") result = variable instanceof Deck;
            else if (typeToCheck === "hand") result = variable instanceof Hand;
            else if (typeToCheck === "player")
              result = variable instanceof Player;
            else if (typeToCheck === "card") result = variable instanceof Card;
            else
              throw new Error(`Invalid condition:type, b must be a valid type`);
          } else
            throw new Error(
              `Invalid condition:type, a must be a BaseGameObject`
            );
          break;
        case "contains_type":
          if (variable instanceof Deck) result = typeToCheck === "card";
          else if (variable instanceof Hand) result = typeToCheck === "card";
          else if (variable instanceof Player) result = typeToCheck === "hand";
          else if (variable instanceof Array) {
            const variableInArray = variable[0];
            if (!variableInArray) result = false;
            else if (variableInArray instanceof Deck)
              result = typeToCheck === "deck";
            else if (variableInArray instanceof Hand)
              result = typeToCheck === "hand";
            else if (variableInArray instanceof Player)
              result = typeToCheck === "player";
            else if (variableInArray instanceof Card)
              result = typeToCheck === "card";
            else
              throw new Error(`Invalid condition:type, b must be a valid type`);
          } else
            throw new Error(
              `Invalid condition:type, a must be a container or array`
            );
          break;
      }
    }
  }

  if (typeof result !== "number") throw new Error("Invalid condition");
  else if (condition.not) result = !result;
  return result;
}
