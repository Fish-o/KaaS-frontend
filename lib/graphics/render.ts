import { Graphics } from ".";
import { Game, GameState } from "../game/Game";
import { Card } from "../game/Objects/Card";
import { Hand } from "../game/Objects/Player";
import config from "./config";
import { renderSelector } from "./selector";

export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  graphics: Graphics
) {
  const game = graphics.game;
  if (!game) return;
  ctx.fillStyle = "#097464";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  renderDecks(ctx, game);
  renderPlayers(ctx, game);
  renderStartButton(ctx, graphics);
  renderSelector(graphics);
}

function renderStartButton(ctx: CanvasRenderingContext2D, graphics: Graphics) {
  const game = graphics.game;
  if (game.game_state !== GameState.Setup) return;
  const buttonHeight = 40;
  const buttonWidth = 150;
  const xPos = ctx.canvas.width - buttonWidth + 10;
  const yPos = ctx.canvas.height - 80;

  ctx.shadowColor = "rgba(0, 0, 0, 0)";
  ctx.shadowOffsetY = 2;
  ctx.shadowOffsetX = 2;
  ctx.shadowBlur = 5;
  ctx.strokeStyle = "#07d853";
  ctx.fillStyle = "#07d853";
  roundRect(ctx, xPos, yPos, buttonWidth, buttonHeight, 5, true);
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "black";
  ctx.font = "30px Arial";
  ctx.fillText("Start", xPos + 40, yPos + 30);
}

function renderDecks(ctx: CanvasRenderingContext2D, game: Game) {
  const decks = game.getAllDecks();
  const centerX = Math.floor(ctx.canvas.width / 2);
  const centerY = Math.floor(ctx.canvas.height / 2);

  ctx.fillStyle = "white";
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowOffsetY = 2;
  ctx.shadowOffsetX = 2;
  ctx.shadowBlur = 5;
  // console.timeLog("render", "Did background stuff");
  decks.forEach((deck, index, arr) => {
    let decks = arr.length;
    if (decks % 2 === 0) decks /= 2;
    else decks = decks / 2;
    const xOffset = Math.floor(
      config.offsetPerDeck * (decks / 2 - index) - config.cardWidth / 2
    );
    deck.cards.forEach((card, index, cardsArr) => {
      const yOffset = Math.floor(
        (config.offsetPerCard * -index) / 2 - config.cardWidth / 2
      );
      renderCard(
        ctx,
        card,
        deck.cardsOpen,
        centerX + xOffset,
        centerY + yOffset
      );
      // ctx.fillRect(centerX + xOffset, centerY + yOffset, config.cardWidth, config.cardHeight);
    });
  });
  ctx.shadowColor = "transparent";
}

function renderPlayers(ctx: CanvasRenderingContext2D, game: Game) {
  const players = game.getAllPlayers();
  const circleCenterX = Math.floor(ctx.canvas.width / 2);
  const circleCenterY = Math.floor(ctx.canvas.height / 2);
  const circleRadius = Math.floor(
    Math.min(ctx.canvas.width, ctx.canvas.height) / 2 - 100
  );
  const playerCount = players.length;
  const playerAngle = (Math.PI * 2) / playerCount;
  const angleStart = Math.PI / 2;
  // console.timeLog("render", "Drawing players..");

  ctx.fillStyle = "white";

  players.forEach((player, index, arr) => {
    const playerX =
      Math.floor(
        circleCenterX +
          Math.cos(playerAngle * index + angleStart) * circleRadius
      ) -
      config.cardWidth / 2;
    const playerY =
      Math.floor(
        circleCenterY +
          Math.sin(playerAngle * index + angleStart) * circleRadius
      ) -
      config.cardHeight / 2;

    renderHand(
      ctx,
      player.hand,
      true,
      playerX,
      playerY,
      player.user_id === game.user_id
    );
  });
}

function renderCard(
  ctx: CanvasRenderingContext2D,
  card: Card,
  open: boolean,
  x: number,
  y: number,
  outlined: boolean = false
) {
  ctx.fillStyle = "white";
  ctx.fillRect(x, y, config.cardWidth, config.cardHeight);
  ctx.fillStyle = "black";
  ctx.font = "15px Arial";
  if (outlined) {
    ctx.strokeStyle = "red";
    // set width
    ctx.lineWidth = 5;
    ctx.strokeRect(x, y, config.cardWidth, config.cardHeight);
  }
  // log("[RENDERER] Rendering card ");
  if (open) ctx.fillText(card.name, x, y + 50);
}

function renderHand(
  ctx: CanvasRenderingContext2D,
  hand: Hand,
  open: boolean,
  x: number,
  y: number,
  outlined: boolean = false
) {
  const cards = hand.cards;
  cards.forEach((card, index) => {
    const xOffset =
      (cards.length / 2 - index) * config.cardWidth - config.cardWidth / 2;
    const yOffset = 0;
    renderCard(ctx, card, open, x + xOffset, y + yOffset, outlined);
  });
}

/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | { tl: number; tr: number; bl: number; br: number } = 5,
  fill = false,
  stroke = true
) {
  if (typeof radius === "number") {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    radius = { ...{ tl: 0, tr: 0, br: 0, bl: 0 }, ...radius };
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius.br,
    y + height
  );
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }
}
