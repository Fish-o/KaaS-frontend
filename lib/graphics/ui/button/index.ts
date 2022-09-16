import { roundRect } from "../../render";

export interface ButtonField {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  display?: boolean;
  color?: string;
  text?: string;
  hideOnClick?: boolean;
  onActive?: (active: boolean, button?: ButtonField) => void | Promise<void>;
  onClick: (
    x?: number,
    y?: number,
    button?: ButtonField
  ) => void | Promise<void>;
}

export class Button {
  public key: string;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public display?: boolean;
  public color?: string;
  public text?: string;
  public hideOnClick?: boolean;
  public onActive?: (
    active: boolean,
    button?: ButtonField
  ) => void | Promise<void>;
  public onClick: (
    x?: number,
    y?: number,
    button?: ButtonField
  ) => void | Promise<void>;

  public ctx: CanvasRenderingContext2D;
  constructor({
    key,
    x,
    y,
    width,
    height,
    onClick,
    ctx,
    display,
    color,
    text,
    hideOnClick,
    onActive,
  }: {
    key: string;
    x: number;
    y: number;
    width: number;
    height: number;
    onClick: (
      x?: number,
      y?: number,
      button?: ButtonField
    ) => void | Promise<void>;
    ctx: CanvasRenderingContext2D;
    display?: boolean;
    color?: string;
    text?: string;
    hideOnClick?: boolean;
    onActive?: (active: boolean, button?: ButtonField) => void | Promise<void>;
  }) {
    this.key = key;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.display = display;
    this.color = color;
    this.text = text;
    this.hideOnClick = hideOnClick;
    this.onActive = onActive;
    this.onClick = onClick;

    this.ctx = ctx;
  }
  render() {
    if (!this.display) return;
    const buttonHeight = this.height;
    const buttonWidth = this.width;
    const xPos = this.x;
    const yPos = this.y;

    this.ctx.shadowColor = "transparent";
    this.ctx.strokeStyle = this.color ?? "#07d853";
    this.ctx.fillStyle = this.color ?? "#07d853";
    roundRect(this.ctx, xPos, yPos, buttonWidth, buttonHeight, 5, true);
    this.ctx.fillStyle = "black";
    this.ctx.font = "30px Arial";
    if (this.text) this.ctx.fillText(this.text, xPos + 40, yPos + 30);
  }
}
