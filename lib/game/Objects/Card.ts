import { BaseGameObject } from ".";
import { CardObject } from "../Resolvers";

export class Card extends BaseGameObject {
  private _name: string;
  private _description: string | undefined;
  constructor(opts: {
    name: string;
    description?: string;
    tags: string[];
    data: Record<string, string>;
  }) {
    super(opts.tags, opts.data);
    this._name = opts.name;
    this._description = opts.description ?? undefined;
  }
  get name() {
    return this._name;
  }
  get description() {
    return this._description;
  }

  makeGameObject(): CardObject {
    return {
      type: "object:card",
      object: {
        tags: [...this.tags],
        data: { ...this.data },
        name: this.name,
        description: this.description ?? null,
      },
    };
  }

  getIdentifier(): `card:${string}` {
    return `card:${this.id}`;
  }
}
