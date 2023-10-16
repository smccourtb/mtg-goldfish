import React, { useEffect, useState } from "react";
import Card from "./Card";
import Button from "./Button";
import LifeTracker from "./LifeTracker";
import { useOpponent } from "../hooks/useOpponent";
import { OpponentCreature } from "../types";
import { createPortal } from "react-dom";
import StatBar from "./StatBar";

type GameProps = {};

enum PlayersTurn {
  Player = 0,
  Opponent = 1,
}

const priorityName = {
  [PlayersTurn.Player]: "Player",
  [PlayersTurn.Opponent]: "Opponent",
};

const Game = ({}: GameProps) => {
  const battlefieldRef = React.useRef(null);
  const [priority, setPriority] = useState(PlayersTurn.Player);
  const [turn, setTurn] = useState({
    player: PlayersTurn.Player,
    count: 0,
  });
  const [message, setMessage] = useState({ message: "", autoClose: false });
  const [battlefield, setBattlefield] = useState<OpponentCreature[]>([]);
  const updateMessage = (message: string, autoClose: boolean) => {
    setPriority((prev) =>
      prev === PlayersTurn.Player ? PlayersTurn.Opponent : PlayersTurn.Player
    );
    setMessage({ message, autoClose });
  };

  const {
    tapCreature,
    destroyCreature,
    responseToSpell,
    responseToAttack,
    permanents,
    stats,
    setPhase,
  } = useOpponent(priority === PlayersTurn.Opponent, updateMessage);

  useEffect(() => {
    setBattlefield(permanents.creatures);
  }, [permanents]);

  // useEffect(() => {
  //   if (priority === PlayersTurn.Opponent) {
  //     setTimeout(() => {
  //       setPriority(PlayersTurn.Player);
  //     }, 2000);
  //   }
  // }, [priority]);

  const playerActions = [
    <Button key="cast" onClick={() => responseToSpell()}>
      <span className="text-xs md:text-base">Cast spell</span>
    </Button>,

    <Button key="attack" onClick={() => responseToAttack()}>
      <span className="text-xs md:text-base">Attack</span>
    </Button>,
  ];

  const closeMessageModal = () => {
    setMessage({ message: "", autoClose: false });
    setPriority((prev) =>
      prev === PlayersTurn.Player ? PlayersTurn.Opponent : PlayersTurn.Player
    );
  };

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
      <StatBar
        stats={stats}
        priorityName={priorityName[turn.player]}
        turn={turn.count}
      />
      <section
        className="relative bg-green-500 flex-col flex h-2/3 w-full"
        ref={battlefieldRef}
      >
        {message.message &&
          battlefieldRef.current &&
          createPortal(
            <MessageModal
              message={message.message}
              close={closeMessageModal}
              autoClose={message.autoClose}
            />,
            battlefieldRef.current
          )}
        <div className="mx-auto flex gap-4 py-4 h-full w-full flex-wrap items-center justify-center overflow-y-auto">
          {battlefield.map((creature, index) => (
            <Card
              key={index}
              creature={creature}
              tapCreature={() => tapCreature(index)}
              destroyCreature={() => destroyCreature(index)}
            />
          ))}
        </div>
      </section>
      <section className="flex flex-1 h-1/6 bg-gray-700">
        <div className="mt-auto self-end justify-end flex w-full flex-wrap p-4 gap-4">
          {turn.player === PlayersTurn.Player ? (
            [
              ...playerActions.map((action) => action),
              <Button
                key="pass"
                onClick={() => {
                  setTurn((prev) => ({
                    count: prev.count + 1,
                    player: PlayersTurn.Opponent,
                  }));
                  setPriority(PlayersTurn.Opponent);
                  setPhase(0);
                }}
              >
                <span className="text-xs md:text-base">End Turn</span>
              </Button>,
            ]
          ) : (
            <Button
              onClick={() => {
                setTurn((prev) => ({
                  count: prev.count + 1,
                  player: PlayersTurn.Player,
                }));
                setPriority(PlayersTurn.Player);
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

const MessageModal = ({
  autoClose,
  message,
  close,
}: {
  message: string;
  close: () => void;
  autoClose?: boolean;
}) => {
  const [time, setTime] = useState(2000);
  // start a countdown to close the modal
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setTime((prev) => prev - 10);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [time]);

  useEffect(() => {
    if (time === 0) {
      close();
    }
  }, [time]);
  // normalize time to a percentage
  const progress = (time / 2000) * 100;

  const bar = (
    <div className="fixed bottom-0 left-0 h-1 w-full bg-gray-300 rounded-md">
      <div
        className="h-full bg-green-900 rounded-md w-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
  return (
    <div
      onClick={close}
      className="inset-0 flex justify-center items-center overflow-hidden"
    >
      <div className="absolute top-4 flex flex-col bg-white p-4 rounded-md text-black h-1/4 drop-shadow-xl w-4/5">
        {message}
        {autoClose && bar}
      </div>
    </div>
  );
};

export default Game;
