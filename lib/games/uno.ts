import { BundleType } from "../game/Objects/CardBundle";
import { DeckType } from "../game/Objects/Deck";
import { GameObject } from "../game/Resolvers";

const unoGame: GameObject = {
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
                minAmount: 1,
                maxAmount: 1,
              },
            },
          },
          returns: {},
        },
        {
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
          type: "action:find.players",
          args: {
            filter: {
              type: "filter:player",
              filter: {
                maxAmount: 100,
                minAmount: 2,
              },
            },
          },
          returns: {
            found_many: "$players",
          },
        },
        {
          type: "action:logic.loop",
          args: {
            actions: [
              {
                type: "action:logic.for_each",
                args: {
                  actions: [
                    {
                      type: "action:find.cards",
                      args: {
                        filter: {
                          type: "filter:card",
                          filter: {
                            inside: "$draw",
                            maxAmount: 1,
                            minAmount: 0,
                          },
                        },
                      },
                      returns: {
                        found_many: "$cards_to_move",
                      },
                    },
                    {
                      type: "action:find.hands",
                      args: {
                        filter: {
                          type: "filter:hand",
                          filter: {
                            from_player: "$player",
                            maxAmount: 1,
                            minAmount: 1,
                          },
                        },
                      },
                      returns: {
                        found_one: "$hand",
                      },
                    },
                    {
                      type: "action:cards.move",
                      args: {
                        cards: "$cards_to_move",
                        to: "$hand",
                      },
                      returns: {},
                    },
                  ],
                  as: "$player",
                  collection: "$players",
                },
                returns: {},
              },
            ],
            loops: 7,
          },
          returns: {},
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
          type: "action:user_input",
          args: {
            inputs: [
              {
                type: "input:select_players",
                input: {
                  min: 1,
                  max: 1,
                  message: "",
                  selector: "$current",
                  actions: [],
                },
                returns: {
                  selected: "$player",
                },
              },
            ],
            operation: "all",
          },
          returns: {},
        },
        {
          type: "action:cards.move",
          args: {
            cards: "$card",
            to: "$hand",
          },
          returns: {},
        },
      ],
    },
  ],
  players: [],
  methods: [],
};
export default unoGame;
