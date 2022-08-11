import { Graphics } from ".";

export interface ButtonField {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  onActive?: (active: boolean) => void | Promise<void>;
  onClick: (x: number, y: number) => void | Promise<void>;
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
export function bindButtons(graphics: Graphics) {
  const canvas = graphics.canvas;
  canvas.addEventListener("mousedown", (e) => {
    const mousePos = getMousePos(canvas, e);
    graphics.buttons.forEach((button) => {
      if (isInside(mousePos.x, mousePos.y, button)) {
        button.onActive && button.onActive(true);
        graphics.activeButtons.push(button);
      }
    });
  });
  canvas.addEventListener("mouseup", (e) => {
    const mousePos = getMousePos(canvas, e);
    graphics.activeButtons.map((b) => {
      if (isInside(mousePos.x, mousePos.y, b)) {
        b.onClick(mousePos.x, mousePos.y);
      }
      b.onActive && b.onActive(false);
    }).length = 0;
  });
  canvas.addEventListener("mousemove", (e) => {
    const mousePos = getMousePos(canvas, e);
    let cursor = "default";
    graphics.activeButtons.forEach((button) => {
      if (!isInside(mousePos.x, mousePos.y, button)) {
        button.onActive && button.onActive(false);
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

export function removeButton(button: ButtonField | string, graphics: Graphics) {
  if (typeof button === "string")
    graphics.buttons = graphics.buttons.filter((b) => b.key !== button);
  else
    graphics.buttons = graphics.buttons.filter(
      (b) => b !== button && b.key !== button.key
    );
}
