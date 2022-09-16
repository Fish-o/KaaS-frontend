import { generateKeyPair } from "../crypto";
import { Game } from "../game/Game";
import { DeckType } from "../game/Objects/Deck";
import {
  bindButtons,
  ButtonField,
  PlayerButton,
  removeButton,
} from "./ui/buttons";
import { renderDecks, renderPlayers } from "./render";
import exampleGame from "../games/example";
import { nanoid } from "nanoid";
import { awaitEvent, broadcastGameEvent } from "../networking/events";
import { Player } from "../game/Objects/Player";
import { GameObject } from "../game/Resolvers";
import { UI } from "./ui";
import { Button } from "./ui/button";
import { CardRenderer } from "./card";

function update(delta: number) {
  // log(this._id + " Tick", delta, "ms");
}

export async function init_game(graphics: Graphics): Promise<Game> {
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
    return game;
  }

  log(graphics._id + " init", " Generating hostKeys", graphics.abort);
  const hostKeys = await generateKeyPair(); //Error looking mother fucker happens here. wss shit
  log(graphics._id + " init", hostKeys, graphics.abort);
  // if (graphics.abort) {
  //   log(graphics._id + " init", "INIT HOST ABORT");
  //   throw new Error("Aborted from init here");
  // }

  //Get the game from localStorage
  let gameData;
  let gameDataString = localStorage.getItem("gameSettings");
  if (gameDataString) {
    gameData = JSON.parse(gameDataString) as GameObject;
  }
  if (!gameData) {
    gameData = exampleGame;
  }
  game = new Game(graphics, gameData, hostKeys);
  log(graphics._id + " init", "initHost");
  await game.init_host(lobby, password, playerName);
  return game;
}
export type CanvasContexts = {
  main: HTMLCanvasElement;
  main_ctx: CanvasRenderingContext2D;
  card: HTMLCanvasElement;
  card_ctx: CanvasRenderingContext2D;
  ui: HTMLCanvasElement;
  ui_ctx: CanvasRenderingContext2D;
};
export class Graphics {
  public _id = nanoid(3);
  public game!: Game;
  public mainCanvas: HTMLCanvasElement;
  public mainCtx: CanvasRenderingContext2D;

  public playersSelecting: Player[] | null = null;

  private _lastTime: number = Date.now();
  private _initializing: boolean = false;
  public abort: boolean = false;

  public UI: UI;
  public cardRenderer: CardRenderer;
  constructor() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    if (!canvas) throw new Error("Canvas not found");
    canvas.setAttribute("width", `${window.innerWidth}`);
    canvas.setAttribute("height", `${window.innerHeight}`);

    let ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Context not found");
    this.mainCanvas = canvas;
    this.mainCtx = ctx;

    addEventListener("resize", () => {
      if (typeof document !== "undefined") {
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        canvas.setAttribute("width", `${window.innerWidth}`);
        canvas.setAttribute("height", `${window.innerHeight}`);
      }
    });

    this.UI = new UI(this);
    this.cardRenderer = new CardRenderer();

    log(this._id + " graphics", " <constructor>", "Made");
  }

  public async init() {
    if (this._initializing) throw new Error("Already initializing");
    else if (this.game) throw new Error("Already initialized");
    this._initializing = true;
    try {
      const game = await init_game(this);
      this.game = game;
      if (this.abort) {
        log(this._id + " graphics", " <init> Stopped, cleaning up");
        return this.cleanup();
      }
      this._initializing = false;
      log(this._id + " graphics", " <init>", "Init'd");
      this.tick();
    } catch (e) {
      log(this._id + " graphics", " <init>", "ERROR", e);
      console.error(e);
      this._initializing = false;
      this.abort = true;
    }
  }

  public render() {
    const ctx = this.mainCtx;
    const game = this.game;
    if (!game) return;
    ctx.fillStyle = "#097464";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    renderDecks(this, game);
    renderPlayers(this, game);

    this.UI.render();
  }

  public start() {
    if (!this.game) throw new Error("Graphics not initialized, run init()");
    this._lastTime = Date.now();
    this.abort = false;
    log(this._id + " graphics", " <start>", "Starded'd");
    if (this.game.is_host)
      this.UI.addButton(
        new Button({
          x: this.mainCanvas.width - 150 + 10,
          y: this.mainCanvas.height - 80,
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
          ctx: this.UI.ctx,
        })
      );
    else
      awaitEvent(this.game, "game_start").then((e) => {
        this.game.start();
      });
  }

  async game_tick() {
    const { next } = await this.game.tick();
    const shouldDisplay = this.game.user_id === next.user_id;
    if (shouldDisplay)
      this.UI.addButton(
        new Button({
          x: this.mainCanvas.width - 200 + 10,
          y: this.mainCanvas.height - 80,
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
          ctx: this.UI.ctx,
        })
      );
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
    this.game.abort();
    this.mainCtx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
    this.UI.cleanup();
  }
}

export function log(module: string, ...args: any[]) {
  console.log(`[${module}]`, ...args);
}
