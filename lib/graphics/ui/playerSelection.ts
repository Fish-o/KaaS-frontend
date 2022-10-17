import { Player } from "../../game/Objects/Player";
import { Button } from "./button";
import { UI } from "./index";
export class PlayerSelectionUI {
  public playersSelecting: Player[] | null = null;
  public onSelection: (player: Player) => void;
  public _UI: UI;
  constructor(_UI: UI, players: Player[]) {
    this.playersSelecting = players;
    const buttonWidth = 100;
    const buttonHeight = 50;
    this._UI = _UI;
    players.forEach((player, index, players) => {
      console.log("Adding button", player);
      const x =
        500 -
        (players.length * (buttonWidth + 10)) / 2 +
        index * (buttonWidth + 10);

      const y = 500 - buttonHeight / 2;

      _UI.addButton(
        new Button({
          key: `select-player-${player.id}`,
          x,
          y,
          fontSize: 20,
          width: buttonWidth,
          height: buttonHeight,
          onClick: () => {
            this.select(player);
          },
          text: player.name,
          display: true,
        })
      );
    });
  }
  public select(player: Player) {
    this.remove();
    this.playersSelecting = null;
    this.onSelection(player);
  }
  public remove() {
    this.playersSelecting?.forEach((player) => {
      this._UI.removeButton(`select-player-${player.id}`);
    });
  }
  public subscribe(callback: (player: Player) => void) {
    this.onSelection = callback;
  }
}
