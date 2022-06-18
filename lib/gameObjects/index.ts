export class BaseGameObject {
  private _id: string;
  private _tags: string[];

  constructor(tags: string[]) {
    this._id = crypto.randomUUID();
    this._tags = tags;
  }

  get id() {
    return this._id;
  }

  get tags() {
    return this._tags as readonly string[];
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
