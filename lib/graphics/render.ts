import { CanvasContexts, Graphics } from ".";
import { Game, GameState } from "../game/Game";
import { Card } from "../game/Objects/Card";
import { Hand } from "../game/Objects/Player";
import { ButtonField } from "./ui/buttons";
import config from "./config";
import { renderHand } from "./hand";

export function renderCanvas(graphics: Graphics) {}

export function renderDecks(graphics: Graphics, game: Game) {
  const ctx = graphics.mainCtx;
  const decks = game.getAllDecks();
  const centerX = Math.floor(ctx.canvas.width / 2);
  const centerY = Math.floor(ctx.canvas.height / 2);

  ctx.fillStyle = "white";
  // ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  // ctx.shadowOffsetY = 2;
  // ctx.shadowOffsetX = 2;
  // ctx.shadowBlur = 5;
  // console.timeLog("render", "Did background stuff");
  decks.forEach((deck, index, arr) => {
    let decks = arr.length;
    if (decks % 2 === 0) decks /= 2;
    else decks = decks / 2;
    const xOffset = Math.floor(
      config.offsetPerDeck * (decks / 2 - index) - config.cardWidth / 2
    );
    // limit the number of card renders to 10
    const cards = deck.cards.slice(0, 1000).reverse();
    cards.forEach((card, index, cardsArr) => {
      const yOffset = Math.floor(
        (config.offsetPerCard * index) / 2 - config.cardWidth / 2
      );
      graphics.cardRenderer.renderCardBackground(
        ctx,
        card,
        deck.cardsOpen,
        centerX + xOffset,
        centerY + yOffset
      );
      // ctx.fillRect(centerX + xOffset, centerY + yOffset, config.cardWidth, config.cardHeight);
    });
    if (cards.length > 0) {
      const yOffset = Math.floor(
        (config.offsetPerCard * (cards.length - 1)) / 2 - config.cardWidth / 2
      );
      graphics.cardRenderer.renderCard(
        ctx,
        cards[cards.length - 1],
        deck.cardsOpen,
        centerX + xOffset,
        centerY + yOffset
      );
    }
    // cards.forEach((card, index, cardsArr) => {
    //   const yOffset = Math.floor(
    //     (config.offsetPerCard * -index) / 2 - config.cardWidth / 2
    //   );
    //   renderCard(
    //     ctxs,
    //     card,
    //     deck.cardsOpen,
    //     centerX + xOffset,
    //     centerY + yOffset
    //   );
    //   // ctx.fillRect(centerX + xOffset, centerY + yOffset, config.cardWidth, config.cardHeight);
    // });
  });
  // ctx.shadowColor = "transparent";
}

export function renderPlayers(graphics: Graphics, game: Game) {
  const ctx = graphics.mainCtx;

  const players = game.getAllPlayers();
  const circleCenterX = Math.floor(ctx.canvas.width / 2);
  const circleCenterY = Math.floor(ctx.canvas.height / 2);
  const circleRadius = Math.floor(
    Math.min(ctx.canvas.width, ctx.canvas.height) / 2 - 100
  );
  const playerCount = players.length;
  const playerAngle = (Math.PI * 2) / playerCount;
  const playerIndex = players.findIndex(
    (player) => player.user_id === game.user_id
  );
  const angleStart = Math.PI / 2 - playerAngle * playerIndex;

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
      graphics,
      graphics.mainCtx,
      player.hand,
      true,
      playerX,
      playerY,
      player.isCurrentPlayer(game)
    );
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
export function roundRect(
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
