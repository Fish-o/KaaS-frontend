import { Card } from "../game/Objects/Card";
import config from "./config";
import { roundRect } from "./render";

export class CardRenderer {
  public cardImageCanvas: HTMLCanvasElement;
  public cardImageCtx: CanvasRenderingContext2D;
  constructor() {
    //
    const canvas = document.getElementById("cardCanvas") as HTMLCanvasElement;
    if (!canvas) throw new Error("Card Canvas not found");

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Context not found");

    this.cardImageCanvas = canvas;
    this.cardImageCtx = ctx;

    this.cardImageCanvas.width = config.cardWidth;
    this.cardImageCanvas.height = config.cardHeight;

    ctx.globalAlpha = 0.0;
    ctx.fillRect(0, 0, config.cardWidth, config.cardHeight);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "white";

    roundRect(ctx, 0, 0, config.cardWidth, config.cardHeight, 8, true);
  }
  renderCardBackground(
    ctx: CanvasRenderingContext2D,
    card: Card,
    open: boolean,
    x: number,
    y: number,
    outlined: boolean = false
  ) {
    ctx.drawImage(this.cardImageCanvas, x, y);
  }
  renderCard(
    ctx: CanvasRenderingContext2D,
    card: Card,
    open: boolean,
    x: number,
    y: number,
    outlined: boolean = false
  ) {
    if (open) {
      ctx.fillStyle = "black";
      ctx.font = "15px Arial";
      ctx.fillText(card.name, x, y + 50);
    }
  }
}
