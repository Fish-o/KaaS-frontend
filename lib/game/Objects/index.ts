import { nanoid } from "nanoid";
import { Game } from "../Game";
import { Card } from "./Card";

export class BaseGameObject {
  private _id: string;
  private _tags: string[];
  private _data: Record<string, string>;

  private _onUpdate: ((object: BaseGameObject) => void)[] = [];
  subscribeUpdate(callback: (object: BaseGameObject) => void) {
    this._onUpdate.push(callback);
  }
  unSubscribeUpdate(callback: (object: BaseGameObject) => void) {
    this._onUpdate = this._onUpdate.filter((c) => c !== callback);
  }
  issueUpdate(object: BaseGameObject) {
    this._onUpdate.forEach((c) => c(object));
  }

  constructor(
    tags: string[],
    data: Record<string, string>,
    id: string = nanoid()
  ) {
    this._id = id;
    this._tags = tags;
    this._data = data;
  }

  get id() {
    return this._id;
  }

  get tags() {
    return this._tags as readonly string[];
  }

  get data() {
    return this._data as Readonly<Record<string, string>>;
  }

  setData(key: string, value: string) {
    this._data[key] = value;
  }

  getData(key: string) {
    return this._data[key];
  }

  hasTag(tag: string, startsWith?: boolean): boolean {
    if (!startsWith) return this._tags.indexOf(tag) !== -1;
    return this._tags.some((t) => t.startsWith(tag));
  }

  hasAnyTag(tags: string[], startsWith?: boolean): boolean {
    if (!startsWith) return tags.some((t) => this._tags.indexOf(t) !== -1);
    return tags.some((t) => this._tags.some((t2) => t2.startsWith(t)));
  }

  hasAllTags(tags: string[], startsWith?: boolean): boolean {
    if (!startsWith) return tags.every((t) => this._tags.indexOf(t) !== -1);
    return tags.every((t) => this._tags.some((t2) => t2.startsWith(t)));
  }

  addTag(tag: string) {
    this._tags.push(tag);
  }

  removeTag(tag: string) {
    this._tags = this._tags.filter((t) => t !== tag);
  }
}
export function getCardSource(card: Card, game: Game) {
  return [...game.getAllHands(), ...game.getAllDecks()].find((source) =>
    source.hasCard(card)
  );
}
