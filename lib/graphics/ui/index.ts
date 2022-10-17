import { Game } from "../../game/Game";
import { Card } from "../../game/Objects/Card";
import { Player } from "../../game/Objects/Player";
import { awaitEvent, broadcastGameEvent } from "../../networking/events";
import { Button } from "./button";
import { ButtonField } from "./buttons";
import { CardSelectionUI } from "./cardSelection";
import { PlayerSelectionUI } from "./playerSelection";
const CANVAS_ID = "uiCanvas";
export class UI {
  private _buttons: Button[] = [];
  public activeButtons: Button[] = [];
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public game: Game;
  constructor(game: Game) {
    this.game = game;
  }

  private _onUpdate: ((object: UI) => void)[] = [];
  subscribeUpdate(callback: (object: UI) => void) {
    this._onUpdate.push(callback);
  }
  unSubscribeUpdate(callback: (object: UI) => void) {
    this._onUpdate = this._onUpdate.filter((c) => c !== callback);
  }
  issueUpdate(object: UI) {
    this._onUpdate.forEach((c) => c(object));
  }

  async game_tick() {
    const { next } = await this.game.tick();
    const shouldDisplay = this.game.user_id === next.user_id;
    if (shouldDisplay)
      this.addButton(
        new Button({
          x: -10,
          y: 80,
          height: 40,
          width: 100,
          fontSize: 30,
          key: "tick",
          text: "Start turn",
          color: "#07d853",
          display: shouldDisplay,
          hideOnClick: true,
          onClick: async (x, y) => {
            await broadcastGameEvent(this.game, {
              event: "game_tick",
            });
            setTimeout(() => {
              this.game_tick();
            }, 50);
          },
        })
      );
    else
      awaitEvent(this.game, "game_tick").eventPromise.then((e) => {
        this.game_tick();
      });
  }
  public prompt_start() {
    if (!this.game) throw new Error("Graphics not initialized, run init()");
    log("UI", " <start>", "Starded'd");
    if (this.game.is_host)
      this.addButton(
        new Button({
          x: 0,
          y: 0,
          height: 100,
          width: 150,
          fontSize: 75,
          key: "start",
          text: "Start",
          color: "#07d853",
          display: true,
          hideOnClick: true,
          onClick: (x, y) => {
            broadcastGameEvent(this.game, {
              event: "game_start",
            });
            this.removeButton("start");
            this.game.start();
          },
        })
      );
    else
      awaitEvent(this.game, "game_start").eventPromise.then((e) => {
        this.game.start();
      });
  }
  public promptPlayerSelection(players: Player[]) {
    console.log("Prompting player selection");
    let cancelPromise = () => {
      console.log("Cancelled player selection before it was even started");
    };

    const ui = new PlayerSelectionUI(this, players);

    const selectedPlayers = new Promise<Player>((resolve, reject) => {
      cancelPromise = () => {
        ui.remove();
        reject("Cancelled");
      };
      ui.subscribe((player) => {
        resolve(player);
      });
    });

    return {
      cancel: cancelPromise,
      playerPromise: selectedPlayers,
    };
  }

  public promptCardSelection(
    cards: Card[],
    minCards: number,
    maxCards: number
  ) {
    console.log("Prompting card selection");
    let cancelPromise = () => {
      console.log("Cancelled card selection before it was even started");
    };

    const ui = new CardSelectionUI(this, cards, minCards, maxCards);

    const selectedCards = new Promise<Card[]>((resolve, reject) => {
      cancelPromise = () => {
        ui.remove();
        reject("Cancelled");
      };
      ui.subscribe((cards) => {
        resolve(cards);
      });
    });

    return {
      cancel: cancelPromise,
      promise: selectedCards,
    };
  }

  get buttons() {
    return this._buttons as Readonly<Button[]>;
  }
  public addButton(button: Button) {
    console.log("Adding button", button);
    this._buttons.push(button);
    this.issueUpdate(this);
  }

  public removeButton(button: ButtonField | string) {
    console.log("Removing button", button);
    if (typeof button === "string")
      this._buttons = this._buttons.filter((b) => b.key !== button);
    else
      this._buttons = this._buttons.filter(
        (b) => b !== button && b.key !== button.key
      );
    this.issueUpdate(this);
  }
  public cleanup() {
    this._buttons = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public gameWin(player: Player) {
    this.addButton(
      new Button({
        x: 200,
        y: 0,
        height: 100,
        width: 500,
        fontSize: 75,
        key: "game_win",
        text: `Game win ${player.name}... Redirecting...`,
        color: "#07d853",
        display: true,
        hideOnClick: true,
        onClick: (x, y) => {},
      })
    );
  }
}
export function log(module: string, ...args: any[]) {
  console.log(`[${module}]`, ...args);
}
