import { generateKeyPair } from "../crypto";
import { Game } from "../game/Game";
import { DeckType } from "../game/Objects/Deck";
import {
  bindButtons,
  ButtonField,
  PlayerButton,
  removeButton,
} from "./buttons";
import { renderCanvas } from "./render";
import exampleGame from "../games/example";
import { nanoid } from "nanoid";
import { awaitEvent, broadcastGameEvent } from "../networking/events";
import { Player } from "../game/Objects/Player";

function update(delta: number) {
  // log(this._id + " Tick", delta, "ms");
}

export async function init(graphics: Graphics): Promise<Game> {
  let queryParams = new URLSearchParams(window.location.search);
  const lobby = queryParams.get("lobby");
  const password = queryParams.get("password");
  const playerName = queryParams.get("name");
  if (!lobby || !password || !playerName) {
    console.error("Missing parameters");
    throw new Error("Missing parameters");
  }
  let game: Game;
  log(graphics._id + " startinit", "init");
  if (!queryParams.get("host")) {
    log(graphics._id + " init", "initClient");
    game = await Game.init_client(graphics, lobby, password, playerName);
  } else {
    log(graphics._id + " init", " Generating hostKeys", graphics.abort);
    const hostKeys = await generateKeyPair(); //Error looking mother fucker happens here. wss shit
    log(graphics._id + " init", hostKeys, graphics.abort);
    // if (graphics.abort) {
    //   log(graphics._id + " init", "INIT HOST ABORT");
    //   throw new Error("Aborted from init here");
    // }
    game = new Game(graphics, exampleGame, hostKeys);
    log(graphics._id + " init", "initHost");
    await game.init_host(lobby, password, playerName);
  }

  return game;
}

export class Graphics {
  public _id = nanoid(3);
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public game!: Game;

  public buttons: ButtonField[] = [];

  public playersSelecting: Player[] | null = null;

  public activeButtons: ButtonField[] = [];
  private _lastTime: number = Date.now();
  private _initializing: boolean = false;
  public abort: boolean = false;

  constructor() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    if (!canvas) throw new Error("Could not get canvas");
    canvas.setAttribute("width", `${window.innerWidth}`);
    canvas.setAttribute("height", `${window.innerHeight}`);

    let ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get context");

    addEventListener("resize", () => {
      if (typeof document !== "undefined") {
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        canvas.setAttribute("width", `${window.innerWidth}`);
        canvas.setAttribute("height", `${window.innerHeight}`);
      }
    });
    this.canvas = canvas;
    this.ctx = ctx;
    bindButtons(this);
    log(this._id + " graphics", " <constructor>", "Made");
  }

  public async init() {
    if (this._initializing) throw new Error("Already initializing");
    else if (this.game) throw new Error("Already initialized");
    this._initializing = true;
    try {
      const game = await init(this);
      this.game = game;
      if (this.abort) {
        log(this._id + " graphics", " <init> Stopped, cleaning up");
        return this.cleanup();
      }
      this._initializing = false;
      log(this._id + " graphics", " <init>", "Init'd");
      this.tick();
    } catch (e) {
      log(this._id + " graphics", " <init>", "ERROR");
      console.error(e);
      this._initializing = false;
      this.abort = true;
    }
  }

  public render() {
    renderCanvas(this.ctx, this);
  }

  public start() {
    if (!this.game) throw new Error("Graphics not initialized, run init()");
    this._lastTime = Date.now();
    this.abort = false;
    log(this._id + " graphics", " <start>", "Starded'd");
    if (this.game.is_host)
      this.addButton({
        x: this.canvas.width - 150 + 10,
        y: this.canvas.height - 80,
        height: 40,
        width: 150,
        key: "start",
        text: "Start",
        color: "#07d853",
        display: true,
        hideOnClick: true,
        onClick: (x, y) => {
          broadcastGameEvent(this.game, {
            event: "game_start",
          });
          this.game.start();
        },
      });
    else
      awaitEvent(this.game, "game_start").then((e) => {
        this.game.start();
      });
  }
  async game_tick() {
    const { next } = await this.game.tick();
    const shouldDisplay = this.game.user_id === next.user_id;
    if (shouldDisplay)
      this.addButton({
        x: this.canvas.width - 200 + 10,
        y: this.canvas.height - 80,
        height: 40,
        width: 200,
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
      });
    else
      awaitEvent(this.game, "game_tick").then((e) => {
        this.game_tick();
      });
  }
  private tick() {
    const now = Date.now();
    const dt = (now - this._lastTime) / 1000.0;
    update(dt);
    this.render();
    this._lastTime = now;
    if (!this.abort)
      requestAnimationFrame(() => {
        if (!this.abort) this.tick();
      });
  }

  public stop() {
    if (this.abort)
      return log(this._id + " graphics", " <stop> Redundant stop call");
    this.abort = true;
    if (this._initializing)
      return log(
        this._id + " graphics",
        " <stop> Initializing, it can handle it"
      );
    else if (!this.game)
      return log(
        this._id + " graphics",
        " <stop> Not initialized, nothing to do"
      );
    this.cleanup();
    log(this._id + " graphics", " <stop> Cleaned up!");
  }

  private cleanup() {
    this.buttons = [];
    this.game.abort();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public addButton(button: ButtonField) {
    this.buttons.push(button);
  }

  public removeButton(button: ButtonField | string) {
    removeButton(button, this);
  }

  public promptPlayerSelection(players: Player[]): Promise<Player> {
    return new Promise((resolve, reject) => {
      this.playersSelecting = players;
      const oldButtons = this.buttons;
      this.buttons = [];
      const buttonWidth = 100;
      const buttonHeight = 40;
      players.forEach((player, index, players) => {
        const x =
          this.canvas.width / 2 -
          (players.length * (buttonWidth + 10)) / 2 +
          index * (buttonWidth + 10);
        const y = this.canvas.height / 2 - buttonHeight / 2;

        this.addButton({
          key: `select-player-${player.id}`,
          onClick: () => {
            this.playersSelecting = null;
            this.buttons = oldButtons;
            resolve(player);
          },
          x,
          y,
          display: true,
          text: player.name,
          color: "#bbb",
          width: buttonWidth,
          height: buttonHeight,
        });
      });
    });
  }
}

export function log(module: string, ...args: any[]) {
  console.log(`[${module}]`, ...args);
}
