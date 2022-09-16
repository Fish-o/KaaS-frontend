import { Graphics } from ".";
import { Hand } from "../game/Objects/Player";
import config from "./config";

export class HandRenderer {}

export function renderHand(
  graphics: Graphics,
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
    graphics.cardRenderer.renderCardBackground(
      ctx,
      card,
      open,
      xOffset + x,
      yOffset + y,
      outlined
    );
  });
  cards.forEach((card, index) => {
    const xOffset =
      (cards.length / 2 - index) * config.cardWidth - config.cardWidth / 2;
    const yOffset = 0;
    graphics.cardRenderer.renderCard(
      ctx,
      card,
      open,
      xOffset + x,
      yOffset + y,
      outlined
    );
  });
}
