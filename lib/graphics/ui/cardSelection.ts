import { Card } from "../../game/Objects/Card";
import config from "../config";
import { Button } from "./button";
import { UI } from "./index";
export class CardSelectionUI {
  public cardsForSelection: Card[];
  public onSelection: (cards: Card[]) => void;
  public _UI: UI;
  public currentSelection: Card[];
  public minCards: number;
  public maxCards: number;

  public finishButtonShown: boolean = false;
  constructor(_UI: UI, cards: Card[], minCards: number, maxCards: number) {
    this.minCards = minCards;
    this.maxCards = maxCards;
    this.cardsForSelection = cards;
    this.currentSelection = [];
    const buttonWidth = config.cardWidth;
    const buttonHeight = config.cardHeight;

    this._UI = _UI;
    cards.forEach((card, i) => {
      card.setSelectable(true);
      card.onSelect = () => {
        this.select(card);
      };
      card.setSelected(false);
    });
    if (minCards < 1 && maxCards < 1) this.finishSelection();
    if (minCards < 1) {
      _UI.addButton(
        new Button({
          key: `finish-card-selection`,
          x: 500,
          y: 500,
          width: 200,
          height: 50,
          onClick: () => {
            this.finishSelection();
          },

          text: "Finish",
          display: true,
        })
      );
      this.finishButtonShown = true;
    }
  }

  public select(card: Card) {
    if (this.currentSelection.includes(card)) {
      this.currentSelection = this.currentSelection.filter(
        (c) => c.id !== card.id
      );
      card.setSelected(false);
    } else {
      this.currentSelection.push(card);
      card.setSelected(true);
    }

    if (this.currentSelection.length >= this.maxCards) {
      return this.finishSelection();
    }
    if (this.currentSelection.length >= this.minCards) {
      if (!this.finishButtonShown) {
        this._UI.addButton(
          new Button({
            key: `finish-card-selection`,
            x: 500,
            y: 500,
            width: 200,
            height: 50,
            onClick: () => {
              this.finishSelection();
            },

            text: "Finish",
            display: true,
          })
        );
        this.finishButtonShown = true;
      } else {
        this._UI.removeButton(`finish-card-selection`);
        this.finishButtonShown = false;
      }
    }
  }

  public finishSelection() {
    if (this.currentSelection.length < this.minCards) {
      return;
    }
    if (this.currentSelection.length > this.maxCards) {
      this.currentSelection = this.currentSelection.slice(0, this.maxCards);
    }
    this.cardsForSelection?.forEach((card, i) => {
      card.setSelectable(false);
      card.onSelect = () => {};
      card.setSelected(false);
    });
    this.remove();
    this.onSelection(this.currentSelection);
  }
  public remove() {
    // this.cardsForSelection?.forEach((card) => {
    this._UI.removeButton(`finish-card-selection`);
    // });
  }
  public subscribe(callback: (cards: Card[]) => void) {
    this.onSelection = callback;
  }
}
