import { Graphics } from "..";
import { Player } from "../../game/Objects/Player";
import { Button } from "./button";
import { bindButtons, ButtonField, removeButton } from "./buttons";
import { PlayerSelectionUI } from "./playerSelection";
const CANVAS_ID = "uiCanvas";
export class UI {
  public buttons: Button[] = [];
  public activeButtons: Button[] = [];
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public graphics: Graphics;
  constructor(graphics: Graphics) {
    const canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement;
    if (!canvas) throw new Error("UI Canvas not found");
    canvas.setAttribute("width", `${window.innerWidth}`);
    canvas.setAttribute("height", `${window.innerHeight}`);

    let ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Context not found");
    this.canvas = canvas;
    this.ctx = ctx;

    addEventListener("resize", () => {
      if (typeof document !== "undefined") {
        const canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement;
        canvas.setAttribute("width", `${window.innerWidth}`);
        canvas.setAttribute("height", `${window.innerHeight}`);
      }
    });
    this.graphics = graphics;

    bindButtons(this);
  }
  public promptPlayerSelection(players: Player[]): Promise<Player> {
    console.log("Prompting player selection");
    return new Promise((resolve, reject) => {
      new PlayerSelectionUI(this, players, (player) => {
        resolve(player);
      });
    });
  }
  public render() {
    console.log("Rendering UI");
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.buttons.forEach((b) => b.render());
  }
  public addButton(button: Button) {
    console.log("Adding button", button);
    this.buttons.push(button);
  }

  public removeButton(button: ButtonField | string) {
    console.log("Removing button", button);
    if (typeof button === "string")
      this.buttons = this.buttons.filter((b) => b.key !== button);
    else
      this.buttons = this.buttons.filter(
        (b) => b !== button && b.key !== button.key
      );
  }
  public cleanup() {
    this.buttons = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
