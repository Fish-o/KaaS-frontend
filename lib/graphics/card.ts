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
  renderCard(
    ctx: CanvasRenderingContext2D,
    card: Card,
    open: boolean,
    x: number,
    y: number,
    rotationRadians: number = -0.3,
    outlined: boolean = false
  ) {
    ctx.translate(x, y);
    ctx.rotate(rotationRadians);
    if (open && card.loadedImage) {
      ctx.drawImage(
        card.loadedImage,
        0,
        0,
        config.cardWidth,
        config.cardHeight
      );
    } else {
      ctx.drawImage(this.cardImageCanvas, 0, 0);
    }
    // if (card.loadedImage) ctx.drawImage(card.loadedImage, 0, 0);
    ctx.rotate(-rotationRadians);
    ctx.translate(-x, -y);
  }
}
