import { BaseGameObject } from ".";

export class Card extends BaseGameObject {
  private _name: string;
  private _description: string | undefined;
  constructor(opts: { name: string; description?: string; tags: string[] }) {
    super(opts.tags);
    this._name = opts.name;
    this._description = opts.description ?? undefined;
  }
  get name() {
    return this._name;
  }
  get description() {
    return this._description;
  }
}
