import React from "react";
import { useMachine } from "@xstate/react";
import { assign, createMachine, send } from "xstate";
import Card from "./Card";
import Button from "./Button";
import LifeTracker from "./LifeTracker";
import { useOpponent } from "../hooks/useOpponent";
import { OpponentCreature } from "../types";

type GameProps = {};

enum PlayersTurn {
  Player = 0,
  Opponent = 1,
}

const priorityName = {
  [PlayersTurn.Player]: "Player",
  [PlayersTurn.Opponent]: "Opponent",
};

export type GameMachineContext = {
  opponent: {
    creatures: OpponentCreature[];
    availableMana: number;
    manaPool: number;
    handSize: number;
    life: number;
    library: number;
    graveyard: number;
  };
  message: string;
  turn: number;
  priority: PlayersTurn;
};

export const gameMachine = createMachine({
  id: "game",
  initial: "player",
  context: {
    opponent: {
      creatures: [],
      availableMana: 0,
      manaPool: 0,
      handSize: 7,
      life: 40,
      library: 60,
      graveyard: 0,
    },
    message: "",
    turn: 1,
    priority: PlayersTurn.Player,
  },
  states: {
    player: {
      on: {
        PASS: "opponent",
        "creature.destroy": {
          actions: assign({
            opponent: (
              context: GameMachineContext,

              event: { type: string; value: OpponentCreature[] }
            ) => {
              const { value } = event;
              return {
                ...context.opponent,
                creatures: value,
              };
            },
          }),
        },
        "response.cast": {
          actions: assign({
            opponent: (
              context: GameMachineContext,
              event: {
                type: string;
                value: {
                  opponent: GameMachineContext["opponent"];
                  message: string;
                };
              }
            ) => {
              const { value } = event;
              return {
                ...context.opponent,
                availableMana: value.opponent.availableMana,
              };
            },
            message: (context, event) => {
              const { value } = event;
              return value.message;
            },
          }),
        },
        "response.attack": {
          actions: assign({
            opponent: (
              context: GameMachineContext,
              event: {
                type: string;
                value: {
                  opponent: GameMachineContext["opponent"];
                  message: string;
                };
              }
            ) => {
              const { value } = event;
              return {
                ...context.opponent,
                creatures: value.opponent.creatures,
              };
            },
            message: (context, event) => {
              const { value } = event;
              return value.message;
            },
          }),
        },
        "creature.update": {
          actions: assign({
            opponent: (
              context: GameMachineContext,
              event: { type: string; value: OpponentCreature[] }
            ) => {
              const { value } = event;
              return {
                ...context.opponent,
                creatures: value,
              };
            },
          }),
        },
      },
      entry: [
        assign({
          priority: () => PlayersTurn.Player,
        }),
      ],
    },
    opponent: {
      on: {
        PASS: "player",
        "creature.update": {
          actions: assign({
            opponent: (
              context: GameMachineContext,
              event: { type: string; value: OpponentCreature[] }
            ) => {
              const { value } = event;
              return {
                ...context.opponent,
                creatures: value,
              };
            },
          }),
        },

        "creature.destroy": {
          actions: assign({
            opponent: (
              context: GameMachineContext,
              event: { type: string; value: OpponentCreature[] }
            ) => {
              const { value } = event;
              return {
                ...context.opponent,
                creatures: value,
              };
            },
          }),
        },
      },
      initial: "upkeep",
      states: {
        upkeep: {
          on: { DONE_UPKEEP: "playSpell" },
          after: {
            5000: {
              target: "playSpell",
            },
          },
          entry: [
            assign({
              priority: () => PlayersTurn.Opponent,
            }),
          ],
          invoke: {
            src: "performUpkeep",
            onDone: {
              actions: [
                assign({
                  opponent: (context, data) => {
                    const { opponent } = data.data;
                    return opponent;
                  },
                  message: (context, data) => {
                    const { message } = data.data;
                    return message;
                  },
                }),
              ],
            },
          },
        },
        playSpell: {
          on: { DONE_MAIN: "combat" },
          after: {
            5000: {
              target: "combat",
            },
          },
          invoke: {
            src: "castSpell",
            onDone: {
              actions: [
                assign({
                  message: (context, data) => {
                    const { message } = data.data;
                    return message;
                  },
                  opponent: (context, data) => {
                    const { opponent } = data.data;
                    return opponent;
                  },
                }),
              ],
            },
          },
        },
        combat: {
          on: { DONE_COMBAT: "end" },
          after: {
            5000: {
              target: "end",
            },
          },
          invoke: {
            src: "performCombat",
            onDone: {
              actions: [
                assign({
                  message: (context, data) => {
                    const { message } = data.data;
                    return message;
                  },
                  opponent: (context, data) => {
                    const { opponent } = data.data;
                    return opponent;
                  },
                }),
              ],
            },
          },
        },
        end: {
          entry: [
            assign({
              turn: (context) => context.turn + 1,
              priority: (context) =>
                context.priority === PlayersTurn.Player
                  ? PlayersTurn.Opponent
                  : PlayersTurn.Player,
              opponent: (context) => ({
                ...context.opponent,
                handSize: Math.min(context.opponent.handSize, 7),
                availableMana: context.opponent.manaPool,
              }),
            }),
            send("PASS"),
          ],
        },
      },
    },
  },
});

const Game = ({}: GameProps) => {
  const {
    performUpkeep,
    handlePlaySpell,
    tapCreature,
    destroyCreature,
    attack,
    responseToSpell,
    responseToAttack,
  } = useOpponent();
  const [current, send] = useMachine(gameMachine, {
    devTools: true,
    services: {
      performUpkeep: (ctx) => {
        return new Promise((resolve) => {
          const value = performUpkeep(ctx);
          resolve(value);
        });
      },
      castSpell: (ctx) => {
        return new Promise((resolve) => {
          const value = handlePlaySpell(ctx);
          console.log("value", value);

          resolve(value);
        });
      },
      performCombat: (ctx) => {
        return new Promise((resolve) => {
          const value = attack(ctx);
          resolve(value);
        });
      },
    },
  });

  const playerActions = [
    <Button
      key="cast"
      onClick={() =>
        send({
          type: "response.cast",
          value: responseToSpell(current.context),
        })
      }
    >
      <span className="text-xs md:text-base">Cast spell</span>
    </Button>,

    <Button
      key="attack"
      onClick={() =>
        send({
          type: "response.attack",
          value: responseToAttack(current.context),
        })
      }
    >
      <span className="text-xs md:text-base">Attack</span>
    </Button>,
  ];

  return (
    <>
      <section className="h-1/3 flex">
        <LifeTracker
          color={{
            background: "bg-blue-500",
            active: "active:bg-blue-600",
            text: "text-white",
          }}
        />
        <LifeTracker
          color={{
            background: "bg-red-500",
            active: "active:bg-red-600",
            text: "text-gray-900",
          }}
        />
      </section>
      <section className="h-1/12 flex justify-evenly items-center p-2">
        <div className="text-xs md:text-base font-bold">
          <i className="ms ms-2x scale-75 mb-1.5 ms-tap-alt mr-1 font-bold" />
          {current.context.turn}
        </div>
        <span className="text-xs md:text-base font-bold ">
          <i className="ms ms-2x scale-75 mb-0.5 ms-ability-transform mr-1 font-bold" />
          <span className="align-baseline">
            {current.context.opponent.handSize}
          </span>
        </span>
        <span className="text-xs md:text-base font-bold">
          <i className="ms ms-cost ms-c mr-1 ms-2x scale-75 mb-0.5" />
          {current.context.opponent.availableMana}
        </span>
        <span className="text-xs md:text-base font-bold">
          <i className="ms ms-planeswalker mr-1 ms-2x mb-0.5" />
          {priorityName[current.context.priority]}
        </span>
      </section>
      <section className="bg-green-500 flex-col flex h-2/3 w-full">
        <h1 className="text-white font-bold text-sm md:text-xl m-2 flex h-14 min-h-14 max-h-14">
          {current.context.message && (
            <span className="border border-white rounded-md text-center flex items-center justify-center w-full">
              {current.context.message}
            </span>
          )}
        </h1>
        <div className="mx-auto flex gap-4 py-4 h-full w-full flex-wrap items-center justify-center overflow-y-auto">
          {current.context.opponent.creatures.map((creature, index) => (
            <Card
              key={index}
              creature={creature}
              tapCreature={() =>
                send({
                  type: "creature.update",
                  value: tapCreature(current.context.opponent.creatures, index),
                })
              }
              destroyCreature={() =>
                send({
                  type: "creature.update",
                  value: destroyCreature(
                    current.context.opponent.creatures,
                    index
                  ),
                })
              }
            />
          ))}
        </div>
      </section>
      <section className="flex flex-1 h-1/6 bg-gray-700">
        <Button
          onClick={() => {
            send("PASS");
          }}
        >
          PASS
        </Button>
        <div className="mt-auto self-end justify-end flex w-full flex-wrap p-4 gap-4">
          {current.context.priority === PlayersTurn.Player ? (
            [
              ...playerActions.map((action) => action),
              <Button
                key="pass"
                onClick={() => {
                  send("DONE_UPKEEP");
                }}
              >
                <span className="text-xs md:text-base">End Turn</span>
              </Button>,
            ]
          ) : (
            <Button
              onClick={() => {
                send("DONE_UPKEEP");
              }}
            >
              {"" ? (
                <span className="text-xs md:text-base">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 md:w-6 md:h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
                    />
                  </svg>
                </span>
              ) : (
                <span className="text-xs md:text-base">End Turn</span>
              )}
            </Button>
          )}
        </div>
      </section>
    </>
  );
};

export default Game;
