import { BundleType } from "../game/Objects/CardBundle";
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
        cards: [],
        card_bundles: [BundleType.standard_52],
        type: DeckType.finite,
        cardsOpen: true,
        tags: ["draw"],
        hidden: false,
        overflow: null,
      },
    },
    {
      type: "object:deck",
      object: {
        cards: [],
        type: DeckType.finite,
        cardsOpen: true,
        tags: ["discard"],
        hidden: false,
        overflow: null,
      },
    },
  ],

  settings: {
    minPlayerCount: 2,
    maxPlayerCount: 100,
    turnDirection: "clockwise",
  },

  events: [
    {
      type: "event:game.init",
      actions: [
        {
          type: "action:deck.shuffle",
          args: {
            deck: {
              type: "filter:deck",
              filter: {
                has_tag: "draw",
                maxAmount: 1,
                minAmount: 1,
              },
            },
          },
        },
        {
          // Get deck 2
          type: "action:find.decks",
          args: {
            filter: {
              type: "filter:deck",

              filter: {
                maxAmount: 1,
                minAmount: 1,
                has_tag: "discard",
              },
            },
          },
          returns: {
            found_one: "$discard",
          },
        },
        {
          // Get deck 2
          type: "action:find.decks",
          args: {
            filter: {
              type: "filter:deck",

              filter: {
                maxAmount: 1,
                minAmount: 1,
                has_tag: "draw",
              },
            },
          },
          returns: {
            found_one: "$draw",
          },
        },
        {
          // Get the cards to move
          type: "action:find.cards",
          args: {
            filter: {
              type: "filter:card",

              filter: {
                maxAmount: 1,
                minAmount: 0,
                inside: "$draw",
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
            find: "$discard",
          },
        },
        {
          // Move cards
          type: "action:cards.move",
          args: { cards: "$cards_to_move", to: "$discard" },
        },
        {
          type: "action:debug",
          args: {
            find: "$draw",
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
          returns: {
            selected: "$selected",
          },
        },
        {
          type: "action:find.cards",
          args: {
            filter: {
              type: "filter:card",
              filter: {
                inside: {
                  type: "filter:deck",
                  filter: {
                    has_tag: "draw",
                    maxAmount: 1,
                    minAmount: 1,
                  },
                },
                maxAmount: 1,
                minAmount: 0,
              },
            },
          },
          returns: {
            found_many: "$card",
          },
        },
        {
          type: "action:find.hands",
          args: {
            filter: {
              type: "filter:hand",

              filter: { maxAmount: 1, minAmount: 1, from_player: "$selected" },
            },
          },
          returns: {
            found_one: "$hand",
          },
        },
        {
          type: "action:cards.move",
          args: {
            cards: "$card",
            to: "$hand",
          },
        },
      ],
    },
  ],
  methods: [],
  players: [],
};

export default exampleGame;
