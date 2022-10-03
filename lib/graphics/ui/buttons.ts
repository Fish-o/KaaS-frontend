import { UI } from ".";
import { Player } from "../../game/Objects/Player";

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
export interface PlayerButton {
  player: Player;
  onActive?: (active: boolean) => void | Promise<void>;
  onClick: (x?: number, y?: number) => void | Promise<void>;
}

function isInside(x: number, y: number, field: ButtonField) {
  return (
    x >= field.x &&
    x <= field.x + field.width &&
    y >= field.y &&
    y <= field.y + field.height
  );
}

function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top,
  };
}

export function bindButtons(graphics: UI) {
  const canvas = graphics.canvas;
  canvas.addEventListener("mousedown", (e) => {
    const mousePos = getMousePos(canvas, e);
    graphics.buttons.forEach((button) => {
      if (isInside(mousePos.x, mousePos.y, button)) {
        button.onActive && button.onActive(true, button);
        graphics.activeButtons.push(button);
      }
    });
  });
  canvas.addEventListener("mouseup", (e) => {
    const mousePos = getMousePos(canvas, e);
    graphics.activeButtons.map((b) => {
      if (isInside(mousePos.x, mousePos.y, b)) {
        if (b.hideOnClick) graphics.removeButton(b);
        b.onClick(mousePos.x, mousePos.y);
      }
      b.onActive && b.onActive(false, b);
    }).length = 0;
  });
  canvas.addEventListener("mousemove", (e) => {
    const mousePos = getMousePos(canvas, e);
    let cursor = "default";
    graphics.activeButtons.forEach((button) => {
      if (!isInside(mousePos.x, mousePos.y, button)) {
        button.onActive && button.onActive(false, button);
        graphics.activeButtons.splice(
          graphics.activeButtons.indexOf(button),
          1
        );
      }
    });
    graphics.buttons.forEach((button) => {
      if (isInside(mousePos.x, mousePos.y, button)) {
        cursor = "pointer";
      }
    });

    canvas.style.cursor = cursor;
  });
}

export function removeButton(button: ButtonField | string, graphics: UI) {
  if (typeof button === "string")
    graphics.buttons = graphics.buttons.filter((b) => b.key !== button);
  else
    graphics.buttons = graphics.buttons.filter(
      (b) => b !== button && b.key !== button.key
    );
}
// function renderStartButton(ctxs: CanvasContexts, graphics: Graphics) {
//   const ctx = ctxs.ui_ctx;

//   const game = graphics.game;
//   if (game.game_state !== GameState.Setup) return;
//   const buttonHeight = 40;
//   const buttonWidth = 150;
//   const xPos = ctx.canvas.width - buttonWidth + 10;
//   const yPos = ctx.canvas.height - 80;

//   ctx.shadowColor = "rgba(0, 0, 0, 0)";
//   ctx.shadowOffsetY = 2;
//   ctx.shadowOffsetX = 2;
//   ctx.shadowBlur = 5;
//   ctx.strokeStyle = "#07d853";
//   ctx.fillStyle = "#07d853";
//   roundRect(ctx, xPos, yPos, buttonWidth, buttonHeight, 5, true);
//   ctx.shadowColor = "transparent";
//   ctx.fillStyle = "black";
//   ctx.font = "30px Arial";
//   ctx.fillText("Start", xPos + 40, yPos + 30);
// }
