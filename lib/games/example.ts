import { DeckType } from "../game/Objects/Deck";
import { GameObject } from "../game/Resolvers";
const exampleGame: GameObject = {
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
    maxPlayerCount: 100,
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
    {
      type: "event:game.new_turn",
      returns: {
        current: "$current",
      },

      actions: [
        {
          type: "action:user_input.select_players",
          args: {
            selector: `$current`,
            max: 1,
            min: 1,
            message: "Select a player",
          },
        },
      ],
    },
  ],
  players: [],
};

export default exampleGame;
