import { Graphics } from ".";
import { Player } from "../game/Objects/Player";

const buttonWidth = 100;
const buttonHeight = 40;

export function renderSelector(graphics: Graphics) {
  const playerSelector = graphics.playersSelecting;
  if (!playerSelector) return;
  // darken the screen a bit
  graphics.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  graphics.ctx.fillRect(0, 0, graphics.canvas.width, graphics.canvas.height);

  // render the player buttons in a row
  playerSelector.forEach((player, index) => {
    const xPos =
      graphics.canvas.width / 2 -
      (playerSelector.length * (buttonWidth + 10)) / 2 +
      index * (buttonWidth + 10);
    const yPos = graphics.canvas.height / 2 - buttonHeight / 2;
    graphics.ctx.fillStyle = "white";
    graphics.ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
    graphics.ctx.shadowOffsetY = 2;
    graphics.ctx.shadowOffsetX = 2;
    graphics.ctx.shadowBlur = 5;
    graphics.ctx.fillRect(xPos, yPos, buttonWidth, buttonWidth);
    graphics.ctx.shadowColor = "transparent";

    // Add name to rect
    graphics.ctx.fillStyle = "black";
    graphics.ctx.font = "30px Arial";
    graphics.ctx.fillText(player.name, xPos + 10, yPos + buttonHeight / 2);
  });
}
export function getInfoOfPlayerButton(
  graphics: Graphics,
  players: Player[],
  player: Player
): { x: number; y: number; width: number; height: number } {
  const xPos =
    graphics.canvas.width / 2 -
    (players.length * (buttonWidth + 10)) / 2 +
    players.indexOf(player) * (buttonWidth + 10);
  const yPos = graphics.canvas.height / 2 - buttonHeight / 2;
  return { x: xPos, y: yPos, width: buttonWidth, height: buttonHeight };
}
