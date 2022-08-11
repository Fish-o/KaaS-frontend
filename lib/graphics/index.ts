import { generateKeyPair } from "../crypto";
import { Game } from "../game/Game";
import { DeckType } from "../game/Objects/Deck";
import { bindButtons, ButtonField, removeButton } from "./buttons";
import { renderCanvas } from "./render";
import exampleGame from "../games/example";
import { nanoid } from "nanoid";
import { broadcastGameEvent } from "../networking/events";

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
  if (!queryParams.get("host")) {
    log(graphics._id + " init", "initClient");
    game = await Game.init_client(graphics, lobby, password, playerName);
  } else {
    log(graphics._id + " init", " Generating hostKeys");
    const hostKeys = await generateKeyPair();
    if (graphics.abort) {
      log(graphics._id + " init", "INIT HOST ABORT");
      throw new Error("Aborted from init");
    }
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
    this.addButton({
      x: this.canvas.width - 150 + 10,
      y: this.canvas.height - 80,
      height: 40,
      width: 150,
      key: "start",
      onClick: (x, y) => {
        broadcastGameEvent(this.game, {
          event: "game_start",
        });
        this.game.start();
      },
    });
    this.tick();
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
}

export function log(module: string, ...args: any[]) {
  console.log(`[${module}]`, ...args);
}
