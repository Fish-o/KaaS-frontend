import { DebugContext } from "..";
import { Variable, VariableMap } from "../Actions";
import { Resolvable, resolveBaseObject } from "../Actions/resolvables";
import { Game } from "../Game";
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
  condition: {
    operator: string;
    not: boolean;
  } & {
    [key: string]: any;
  };
}

export type ObjectTypes = `deck` | `card` | `hand` | `player`;
/*
  Conditions
*/
type ObjectVariable = Variable;
type ArrayVariable = Variable;

interface MetaCondition extends BaseCondition {
  type: "condition:meta";
  condition: {
    operator: "and" | "or";
    conditions: Condition[];
    not: boolean;
  };
}

export interface TagCondition extends BaseCondition {
  type: "condition:tags";
  condition: {
    a: ObjectVariable;
    operator: "contains";
    b: string;
    not: boolean;
  };
}

export interface ObjectCondition extends BaseCondition {
  type: "condition:object";
  condition: {
    a: ObjectVariable;
    operator: "is" | "contains";
    b: ObjectVariable;
    not: boolean;
  };
}

export interface ArrayCondition extends BaseCondition {
  type: "condition:array";
  condition: {
    a: ArrayVariable;
    operator: "contains";
    b: ObjectVariable;
    not: boolean;
  };
}

export interface AmountCondition extends BaseCondition {
  type: "condition:amount";
  condition: {
    a: Variable;
    operator: "=" | ">" | "<";
    b: number | Variable;
    not: boolean;
  };
}

export interface TypeCondition extends BaseCondition {
  type: "condition:type";
  condition: {
    a: Variable;
    operator: "is_type" | "contains_type";
    b: ObjectTypes | Variable;
    not: boolean;
  };
}

export interface DataSingleCondition extends BaseCondition {
  type: "condition:data.single";
  condition: {
    key: string;
    a: Variable;
    operator: "=" | "!=" | ">" | "<" | "contains" | "starts_with" | "ends_with";
    b: string;
    not: boolean;
  };
}
export interface DataCompareCondition extends BaseCondition {
  type: "condition:data.compare";
  condition: {
    key: string;
    a: Variable;
    operator: "=" | "!=" | ">" | "<" | "contains" | "starts_with" | "ends_with";
    b: Variable;
    not: boolean;
  };
}

export type Condition =
  | MetaCondition
  | TagCondition
  | ObjectCondition
  | ArrayCondition
  | AmountCondition
  | TypeCondition
  | DataSingleCondition
  | DataCompareCondition;

/*
  Performer
*/

async function performMetaCondition(
  { condition: { operator, conditions } }: MetaCondition,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<boolean> {
  let result: boolean = false;

  if (operator === "and") {
    for (const c of conditions) {
      result = await performCondition(c, variables, game, debugContext);
      if (!result) break;
    }
  } else if (operator === "or") {
    for (const c of conditions) {
      result = await performCondition(c, variables, game, debugContext);
      if (result) break;
    }
  } else throw new Error(`Unknown operator: ${operator}`);

  return result;
}

async function performTagCondition(
  { condition: { a, operator, b } }: TagCondition,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<boolean> {
  const variable = variables.get(a);
  if (!variable) throw new Error(`Variable ${a} not found`);
  else if (!(variable instanceof BaseGameObject))
    throw new Error(`Variable ${a} is either a list or not a game object`);
  return variable.hasTag(b);
}

async function performObjectCondition(
  { condition: { a, operator, b } }: ObjectCondition,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<boolean> {
  const variableA = variables.get(a);
  const variableB = variables.get(b);
  if (!variableA) throw new Error(`Variable ${a} not found`);
  else if (!variableB) throw new Error(`Variable ${b} not found`);
  else if (!(variableA instanceof BaseGameObject))
    throw new Error(`Variable ${a} is either a list or not a game object`);
  else if (!(variableB instanceof BaseGameObject)) {
    throw new Error(`Variable ${b} is either a list or not a game object`);
  }
  switch (operator) {
    case "is":
      return variableA === variableB || variableA.id === variableB.id;
    case "contains":
      if (variableA instanceof Deck) {
        if (!(variableB instanceof Card))
          throw new Error(
            `Invalid condition:object, decks can only contain cards`
          );
        return variableA.contains(variableB);
      } else if (variableA instanceof Hand) {
        if (!(variableB instanceof Card))
          throw new Error(
            `Invalid condition:object, hands can only contain cards`
          );
        return variableA.contains(variableB);
      } else if (variableA instanceof Player) {
        if (!(variableB instanceof Hand))
          throw new Error(
            `Invalid condition:object, players can only contain hands`
          );
        return variableA.hand === variableB;
      } else
        throw new Error(
          `Invalid condition:object, invalid type for variable ${a}`
        );
  }
}

async function performArrayCondition(
  { condition: { a, operator, b } }: ArrayCondition,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<boolean> {
  const array = variables.get(a);
  if (!array) throw new Error(`Variable ${a} not found`);
  else if (!(array instanceof Array))
    throw new Error(`Variable ${a} is not an array`);

  const variable = variables.get(b);
  if (!variable) throw new Error(`Variable ${b} not found`);

  if (operator === "contains") {
    if (!(variable instanceof BaseGameObject))
      throw new Error(
        `Invalid condition:array, array can only contain game objects`
      );
    return array.some((v) => v === variable);
  } else {
    throw new Error(`Unknown operator: ${operator}`);
  }
}

async function performAmountCondition(
  { condition: { a, operator, b } }: AmountCondition,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<boolean> {
  const variable = variables.get(a);
  if (!variable) throw new Error(`Variable ${a} not found`);

  const amountToCheck = Number(b);
  if (isNaN(amountToCheck)) {
    throw new Error(`Invalid condition:amount, b must be a number`);
  }
  let actualAmount: number;
  if (variable instanceof Deck) actualAmount = variable.cards.length;
  else if (variable instanceof Hand) actualAmount = variable.cards.length;
  else if (variable instanceof Array) actualAmount = variable.length;
  // else if (variable instanceof Player) actualAmount = variable.hands.length;
  else
    throw new Error(
      `Invalid condition:amount, variable ${b} isn't a card container or array`
    );
  console.log("Amount to check", amountToCheck, actualAmount);

  switch (operator) {
    case "=":
      return actualAmount === amountToCheck;
    case ">":
      return actualAmount > amountToCheck;
    case "<":
      return actualAmount < amountToCheck;
  }
}

async function performTypeCondition(
  { condition: { a, operator, b } }: TypeCondition,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<boolean> {
  const variable = variables.get(a);
  if (!variable) throw new Error(`Variable ${a} not found`);
  let typeToCheck: ObjectTypes;
  if (b === "deck") typeToCheck = "deck";
  else if (b === "hand") typeToCheck = "hand";
  else if (b === "player") typeToCheck = "player";
  else if (b === "card") typeToCheck = "card";
  else if (b.startsWith("$")) {
    const typeToCheckVariable = variables.get(b);
    if (!typeToCheckVariable) throw new Error(`Variable ${b} not found`);
    else if (!(typeToCheckVariable instanceof BaseGameObject))
      throw new Error(`Variable ${b} is not a valid object type`);
    else if (typeToCheckVariable instanceof Deck) typeToCheck = "deck";
    else if (typeToCheckVariable instanceof Hand) typeToCheck = "hand";
    else if (typeToCheckVariable instanceof Player) typeToCheck = "player";
    else if (typeToCheckVariable instanceof Card) typeToCheck = "card";
    else throw new Error(`Variable ${b} is not a valid object type`);
  } else throw new Error(`Invalid condition:type, b must be or have a type`);

  switch (operator) {
    case "is_type":
      if (variable instanceof BaseGameObject) {
        if (typeToCheck === "deck") return variable instanceof Deck;
        else if (typeToCheck === "hand") return variable instanceof Hand;
        else if (typeToCheck === "player") return variable instanceof Player;
        else if (typeToCheck === "card") return variable instanceof Card;
        else throw new Error(`Invalid condition:type, b must be a valid type`);
      } else
        throw new Error(`Invalid condition:type, a must be a BaseGameObject`);
      break;
    case "contains_type":
      if (variable instanceof Deck) return typeToCheck === "card";
      else if (variable instanceof Hand) return typeToCheck === "card";
      else if (variable instanceof Player) return typeToCheck === "hand";
      else if (variable instanceof Array) {
        const variableInArray = variable[0];
        if (!variableInArray) return false;
        else if (variableInArray instanceof Deck) return typeToCheck === "deck";
        else if (variableInArray instanceof Hand) return typeToCheck === "hand";
        else if (variableInArray instanceof Player)
          return typeToCheck === "player";
        else if (variableInArray instanceof Card) return typeToCheck === "card";
        else throw new Error(`Invalid condition:type, b must be a valid type`);
      } else
        throw new Error(
          `Invalid condition:type, a must be a container or array`
        );
      break;
  }
}

async function performDataSingleCondition(
  { condition: { a, operator, b, key } }: DataSingleCondition,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<boolean> {
  const resolvedA = (
    await resolveBaseObject(a, variables, game, debugContext, 1, 1)
  )[0];

  const aKey = resolvedA.data[key];

  let bKey = b;

  switch (operator) {
    case "=":
      return aKey === bKey;
    case "!=":
      return aKey !== bKey;
    case ">":
      let aNum = Number(aKey);
      let bNum = Number(bKey);
      if (isNaN(aNum) || isNaN(bNum))
        throw new Error(`Invalid condition:data, key ${key} is not a number`);
      return aNum > bNum;
    case "<":
      aNum = Number(aKey);
      bNum = Number(bKey);
      if (isNaN(aNum) || isNaN(bNum))
        throw new Error(`Invalid condition:data, key ${key} is not a number`);
      return aNum < bNum;
    case "contains":
      return aKey.includes(bKey);

    case "starts_with":
      return aKey.startsWith(bKey);

    case "ends_with":
      return aKey.endsWith(bKey);
  }
}

async function performDataCompareCondition(
  { condition: { a, operator, b, key } }: DataCompareCondition,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<boolean> {
  const resolvedA = (
    await resolveBaseObject(a, variables, game, debugContext, 1, 1)
  )[0];
  const aKey = resolvedA.data[key];

  const resolvedB = (
    await resolveBaseObject(
      b as Resolvable,
      variables,
      game,
      debugContext,
      1,
      1
    )
  )[0];
  const bKey = resolvedB.data[key];

  switch (operator) {
    case "=":
      return aKey === bKey;
    case "!=":
      return aKey !== bKey;
    case ">":
      let aNum = Number(aKey);
      let bNum = Number(bKey);
      if (isNaN(aNum) || isNaN(bNum))
        throw new Error(`Invalid condition:data, key ${key} is not a number`);
      return aNum > bNum;
    case "<":
      aNum = Number(aKey);
      bNum = Number(bKey);
      if (isNaN(aNum) || isNaN(bNum))
        throw new Error(`Invalid condition:data, key ${key} is not a number`);
      return aNum < bNum;
    case "contains":
      return aKey.includes(bKey);

    case "starts_with":
      return aKey.startsWith(bKey);

    case "ends_with":
      return aKey.endsWith(bKey);
  }
}

// TODO: Make sure this still works, even with all types being arrays
export async function performCondition(
  condition: Condition,
  variables: VariableMap,
  game: Game,
  debugContext: DebugContext
): Promise<boolean> {
  let result: boolean | undefined = undefined;
  console.log("Performing condition", condition, variables);
  switch (condition.type) {
    case "condition:meta":
      result = await performMetaCondition(
        condition,
        variables,
        game,
        debugContext
      );
      break;
    case "condition:tags":
      result = await performTagCondition(
        condition,
        variables,
        game,
        debugContext
      );
      break;
    case "condition:object":
      result = await performObjectCondition(
        condition,
        variables,
        game,
        debugContext
      );
      break;
    case "condition:array":
      result = await performArrayCondition(
        condition,
        variables,
        game,
        debugContext
      );
      break;
    case "condition:amount":
      result = await performAmountCondition(
        condition,
        variables,
        game,
        debugContext
      );
      break;
    case "condition:type":
      result = await performTypeCondition(
        condition,
        variables,
        game,
        debugContext
      );
      break;
    case "condition:data.single":
      result = await performDataSingleCondition(
        condition,
        variables,
        game,
        debugContext
      );
      break;
    case "condition:data.compare":
      result = await performDataCompareCondition(
        condition,
        variables,
        game,
        debugContext
      );
      break;
    default:
      throw new Error("Invalid condition");
  }
  if (condition.condition.not) result = !result;

  console.log("[Game DEBUG] Condition result", condition, variables, result);

  return result;
}
