import Pusher from "pusher-js";
import { generateKeyPair } from "../crypto";
import { Game } from "../game/Game";
import { Card } from "../game/Objects/Card";
import { DeckType } from "../game/Objects/Deck";
import { Hand } from "../game/Objects/Player";

const offsetPerDeck = 100;
const offsetPerCard = 5;
const cardWidth = 70;
const cardHeight = 100;

let lastTime: number = Date.now();
let game: Promise<Game> | null = null;
if (typeof document !== "undefined") {
  let canvas = document.getElementById("canvas") as HTMLCanvasElement;
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

  game = init().then((game) => {
    if (!ctx) throw new Error("Could not get context");
    main(ctx, game);
    return game;
  });
}

function main(ctx: CanvasRenderingContext2D, game: Game) {
  var now = Date.now();
  var dt = (now - lastTime) / 1000.0;
  update(dt);
  render(ctx, game);

  lastTime = now;
  requestAnimationFrame(() => {
    main(ctx, game);
  });
}

function update(delta: number) {
  // console.log("Tick", delta, "ms");
}

function render(ctx: CanvasRenderingContext2D, game: Game) {
  // console.time("render");
  ctx.fillStyle = "#097464";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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
      offsetPerDeck * (decks / 2 - index) - cardWidth / 2
    );
    deck.cards.forEach((card, index, cardsArr) => {
      const yOffset = Math.floor((offsetPerCard * -index) / 2 - cardWidth / 2);
      renderCard(
        ctx,
        card,
        deck.cardsOpen,
        centerX + xOffset,
        centerY + yOffset
      );
      // ctx.fillRect(centerX + xOffset, centerY + yOffset, cardWidth, cardHeight);
    });
  });
  // console.timeLog("render", "Drew decks");

  ctx.shadowColor = "transparent";

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
      cardWidth / 2;
    const playerY =
      Math.floor(
        circleCenterY +
          Math.sin(playerAngle * index + angleStart) * circleRadius
      ) -
      cardHeight / 2;

    renderHand(
      ctx,
      player.hand,
      true,
      playerX,
      playerY,
      player.user_id === game.user_id
    );
  });
  // console.timeEnd("render");
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
    const xOffset = (cards.length / 2 - index) * cardWidth - cardWidth / 2;
    const yOffset = 0;
    renderCard(ctx, card, open, x + xOffset, y + yOffset, outlined);
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
  ctx.fillRect(x, y, cardWidth, cardHeight);
  ctx.fillStyle = "black";
  ctx.font = "15px Arial";
  if (outlined) {
    ctx.strokeStyle = "red";
    // set width
    ctx.lineWidth = 5;
    ctx.strokeRect(x, y, cardWidth, cardHeight);
  }
  // console.log("[RENDERER] Rendering card ");
  if (open) ctx.fillText(card.name, x, y + 50);
}

export async function init(): Promise<Game> {
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
    console.log("initClient");
    game = await Game.init_client(lobby, password, playerName);
  } else {
    console.log("Generating hostKeys");
    const hostKeys = await generateKeyPair();
    game = new Game(
      {
        type: "game",
        name: "test",
        description: "Eyo",
        decks: [
          {
            type: "object:deck",
            object: {
              cards: [
                {
                  type: "object:card",
                  object: {
                    name: "Test 1.1",
                    description: null,
                    tags: ["card", "test1"],
                  },
                },
                {
                  type: "object:card",
                  object: {
                    name: "Test 1.2",
                    description: null,
                    tags: ["card", "test1"],
                  },
                },
                {
                  type: "object:card",
                  object: {
                    name: "Test 2",
                    description: null,
                    tags: ["card", "test2"],
                  },
                },
                {
                  type: "object:card",
                  object: {
                    name: "Filler 1",
                    description: null,
                    tags: ["a"],
                  },
                },
                {
                  type: "object:card",
                  object: {
                    name: "Filler 2",
                    description: null,
                    tags: ["a"],
                  },
                },
                {
                  type: "object:card",
                  object: {
                    name: "Filler 3",
                    description: null,
                    tags: ["a"],
                  },
                },
                {
                  type: "object:card",
                  object: {
                    name: "Filler 4",
                    description: null,
                    tags: ["a"],
                  },
                },
              ],
              type: DeckType.finite,
              cardsOpen: false,
              tags: ["deck1"],
              hidden: false,
              overflow: null,
            },
          },
          {
            type: "object:deck",
            object: {
              cards: [
                {
                  type: "object:card",
                  object: {
                    name: "4H",
                    description: null,
                    tags: ["card", "test1"],
                  },
                },
              ],
              type: DeckType.finite,
              cardsOpen: true,
              tags: ["deck2"],
              hidden: false,
              overflow: null,
            },
          },
        ],
        settings: {
          minPlayerCount: 2,
          maxPlayerCount: 3,
          turnDirection: "normal",
        },

        events: [
          {
            type: "event:game.init",
            actions: [
              {
                // Get deck 1
                type: "action:find.decks",
                args: {
                  filter: {
                    type: "filter:deck",
                    maxAmount: 1,
                    minAmount: 1,
                    filter: {
                      has_tag: "deck1",
                    },
                  },
                },
                returns: {
                  found_one: "$deck1",
                },
              },
              {
                // Get deck 2
                type: "action:find.decks",
                args: {
                  filter: {
                    type: "filter:deck",
                    maxAmount: 1,
                    minAmount: 1,
                    filter: {
                      has_tag: "deck2",
                    },
                  },
                },
                returns: {
                  found_one: "$deck2",
                },
              },
              {
                // Get the cards to move
                type: "action:find.cards",
                args: {
                  filter: {
                    type: "filter:card",
                    maxAmount: 10,
                    minAmount: 3,
                    filter: {
                      inside: "$deck1",
                      has_tag: "card",
                    },
                  },
                },
                returns: {
                  found_many: "$cards_to_move",
                },
              },
              {
                // Debug
                type: "action:debug",
                args: {
                  find: "$deck1",
                },
              },
              {
                // Move cards
                type: "action:cards.move",
                args: { cards: "$cards_to_move", to: "$deck2" },
                returns: {},
              },
              {
                type: "action:debug",
                args: {
                  find: "$deck1",
                },
              },
            ],
            returns: {},
          },
        ],
        players: [],
      },
      hostKeys
    );
    console.log("initHost");
    await game.init_host(lobby, password, playerName);
  }

  return game;
}

export { game };
