import { BaseGameObject } from ".";
import config from "../../graphics/config";
import { CardObject } from "../Resolvers";

export class Card extends BaseGameObject {
  private _name: string;
  private _description: string | undefined;
  private _loadedImage: HTMLImageElement | undefined;
  private _imageLoaded: boolean = false;
  public selectable: boolean = false;
  public selected: boolean = false;
  public onSelect: (arg0: Card) => void = () => {};
  public onDeselect: (arg0: Card) => void = () => {};
  public renderedPosition: { x: number; y: number } = { x: 0, y: 0 };
  public imageName: string;
  constructor(opts: {
    name: string;
    description?: string;
    image_name?: string;
    tags: string[];
    data: Record<string, string>;
    id?: string;
  }) {
    const img = new Image(config.cardWidth, config.cardHeight);

    img.src = "card_images/" + (opts.image_name ?? "back");
    img.onload = () => {
      this._loadedImage = img;
      this._imageLoaded = true;
    };
    super(opts.tags, opts.data, opts.id);

    this.imageName = opts.image_name ?? "back.jpg";
    this._name = opts.name;
    this._description = opts.description ?? undefined;
  }
  get loadedImage() {
    return this._loadedImage;
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

  setRenderedPosition(x: number, y: number) {
    this.renderedPosition = { x, y };
  }

  setSelectable(selectable: boolean) {
    this.selectable = selectable;
    this.issueUpdate(this);
  }

  setSelected(selected: boolean) {
    this.selected = selected;
    this.issueUpdate(this);
  }
}
