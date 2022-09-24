import { Card } from "../../game/Objects/Card";
import { Player } from "../../game/Objects/Player";
import config from "../config";
import { Button } from "./button";
import { UI } from "./index";
export class CardSelectionUI {
  public cardsForSelection: Card[] | null = null;
  public onSelection: (cards: Card[]) => void;
  public _UI: UI;
  public currentSelection: Card[] = [];
  public minCards: number;
  public maxCards: number;
  constructor(
    _UI: UI,
    cards: Card[],
    onSelection: (cards: Card[]) => void,
    minCards: number = 1,
    maxCards: number = 1
  ) {
    this.minCards = minCards;
    this.maxCards = maxCards;
    this.cardsForSelection = cards;

    const buttonWidth = config.cardWidth;
    const buttonHeight = config.cardHeight;

    this.onSelection = onSelection;
    this._UI = _UI;
    cards.forEach((card, index, players) => {
      const { x, y } = card.renderedPosition;
      _UI.addButton(
        new Button({
          key: `select-card-${card.id}`,
          x,
          y,
          width: buttonWidth,
          height: buttonHeight,
          onClick: () => {
            this.select(card);
          },
          text: card.name,
          display: true,
          ctx: _UI.ctx,
        })
      );
    });

    _UI.addButton(
      new Button({
        key: `finish-card-selection`,
        x: _UI.canvas.width / 2 - buttonWidth / 2,
        y: _UI.canvas.height / 2 - buttonHeight / 2,
        width: buttonWidth,
        height: buttonHeight,
        onClick: () => {
          this.finishSelection();
        },
        text: "Finish",
        display: true,
        ctx: _UI.ctx,
      })
    );
  }

  public select(card: Card) {
    if (this.currentSelection.includes(card)) {
      this.currentSelection = this.currentSelection.filter(
        (c) => c.id !== card.id
      );
    }
    this.currentSelection.push(card);

    if (this.currentSelection.length >= this.maxCards) {
      this.finishSelection();
    }
  }
  public finishSelection() {
    if (this.currentSelection.length < this.minCards) {
      return;
    }
    if (this.currentSelection.length > this.maxCards) {
      this.currentSelection = this.currentSelection.slice(0, this.maxCards);
    }

    this.remove();
    this.onSelection(this.currentSelection);
  }
  public remove() {
    this.cardsForSelection?.forEach((card) => {
      this._UI.removeButton(`select-card-${card.id}`);
    });
  }
}
