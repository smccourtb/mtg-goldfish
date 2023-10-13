import React, { useState } from "react";
import { useMachine } from "@xstate/react";
import { createMachine } from "xstate";
import Card from "./Card";
import Button from "./Button";
import LifeTracker from "./LifeTracker";
import { useOpponent } from "../hooks/useOpponent";

type GameProps = {};

enum PlayersTurn {
  Player = 0,
  Opponent = 1,
}

const priorityName = {
  [PlayersTurn.Player]: "Player",
  [PlayersTurn.Opponent]: "Opponent",
};

const GameMachine = createMachine({
  id: "game",
  initial: "upkeep",
  states: {
    player: {
      on: { PASS: "opponent" },
    },
    opponent: {
      on: { PASS: "player" },
    },
  },
});

const Game = ({}: GameProps) => {
  const [turns, setTurns] = useState<{ count: number; priority: 0 | 1 }>({
    priority: 0,
    count: 1,
  });
  const [message, setMessage] = useState<string>("");
  const {
    respondToSpell,
    respondToAttack,
    playSpell,
    castSpell,
    performTurn,
    creatures,
    resolveAction,
    destroyCreature,
    tapCreature,
    stats,
    actions,
  } = useOpponent(turns.count, turns.priority === PlayersTurn.Opponent);
  const respondToAction = (action: () => string) => {};

  const passTurn = () => {
    setMessage("");
    if (turns.priority === PlayersTurn.Player) {
      setTurns((prev) => ({
        ...prev,
        priority: PlayersTurn.Opponent,
      }));
      performTurn();
    } else {
      setTurns((prev) => ({
        ...prev,
        priority: PlayersTurn.Player,
        count: prev.count + 1,
      }));
    }
  };

  const playerActions = [
    <Button key="cast" onClick={() => setMessage(respondToSpell())}>
      <span className="text-xs md:text-base">Cast spell</span>
    </Button>,

    <Button key="attack" onClick={() => setMessage(respondToAttack())}>
      <span className="text-xs md:text-base">Attack</span>
    </Button>,
  ];

  return (
    <>
      <section className="h-1/3 flex">
        <LifeTracker
            active={!!turns.priority}
            color={{
              background: "bg-blue-500",
              active: "active:bg-blue-600",
              text: "text-white",
            }}
            reset={turns.count === 1}
        />
        <LifeTracker
            active={!turns.priority}
            color={{
              background: "bg-red-500",
              active: "active:bg-red-600",
              text: "text-gray-900",
            }}
            reset={turns.count === 1}
        />
      </section>
      <section className="h-1/12 flex justify-evenly items-center p-2">
        <div className="text-xs md:text-base font-bold">
          <i className="ms ms-2x scale-75 mb-1.5 ms-tap-alt mr-1 font-bold" />
          {turns.count}
        </div>
        <span className="text-xs md:text-base font-bold ">
          <i className="ms ms-2x scale-75 mb-0.5 ms-ability-transform mr-1 font-bold" />
          <span className="align-baseline">{stats.handSize}</span>
        </span>
        <span className="text-xs md:text-base font-bold">
          <i className="ms ms-cost ms-c mr-1 ms-2x scale-75 mb-0.5" />
          {stats.mana}
        </span>
        <span className="text-xs md:text-base font-bold">
          <i className="ms ms-planeswalker mr-1 ms-2x mb-0.5" />
          {priorityName[turns.priority as 0 | 1]}
        </span>
      </section>
      <section className="bg-green-500 flex-col flex h-2/3 w-full">
        <h1 className="text-white font-bold text-sm md:text-xl m-2 flex h-14 min-h-14 max-h-14">
          {message && (
            <span className="border border-white rounded-md text-center flex items-center justify-center w-full">
              {message}
            </span>
          )}
        </h1>
        <div className="mx-auto flex gap-4 py-4 h-full w-full flex-wrap items-center justify-center overflow-y-auto">
          {creatures.map((creature, index) => (
            <Card
              creature={creature}
              destroyCreature={destroyCreature}
              tapCreature={tapCreature}
              id={index}
              key={index}
            />
          ))}
        </div>
      </section>
      <section className="flex flex-1 h-1/6 bg-gray-700">
        <div className="mt-auto self-end justify-end flex w-full flex-wrap p-4 gap-4">
          {turns.priority === PlayersTurn.Player ? (
            [
              ...playerActions.map((action) => action),
              <Button key="pass" onClick={passTurn}>
                <span className="text-xs md:text-base">End Turn</span>
              </Button>,
            ]
          ) : (
            <Button
              onClick={() => {
                const action = resolveAction();
                if (action) {
                  setMessage(action);
                } else {
                  passTurn();
                }
              }}
            >
              {actions.length > 0 ? (
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
