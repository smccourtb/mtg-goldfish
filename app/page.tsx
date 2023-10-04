"use client";
import LifeTracker from "../components/LifeTracker";
import { useEffect, useState } from "react";
import { useOpponent } from "../hooks/useOpponent";
import Button from "../components/Button";

enum PlayersTurn {
  Player = 0,
  Opponent = 1,
}

export default function Page() {
  const [turns, setTurns] = useState({
    priority: 0,
    count: 1,
  });
  const [message, setMessage] = useState("");
  const { respondToSpell, respondToAttack, playSpell } = useOpponent(
    turns.count
  );

  useEffect(() => {
    if (turns.priority === PlayersTurn.Opponent) {
      const action = playSpell();
      setMessage(action);
    }
  }, [turns, playSpell]);

  const respondToAction = (action: () => string) => {
    setMessage(action);
  };

  const passTurn = () => {
    setMessage("");
    // increase the count after the second player passes

    if (turns.priority === PlayersTurn.Player) {
      setTurns((prev) => ({
        ...prev,
        priority: PlayersTurn.Opponent,
      }));
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
      Cast spell
    </Button>,

    <Button key="attack" onClick={() => setMessage(respondToAttack())}>
      Attack
    </Button>,
  ];

  return (
    <main className="grid grid-cols-2 grid-rows-5 h-screen w-screen">
      <section className="col-span-2 row-span-2 flex">
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
      <section className="bg-green-500 col-span-2 row-span-3 flex flex-col grid grid-rows-5">
        {
          <h1 className="text-white font-bold flex items-center justify-center p-4 text-center row-span-2 text-xl">
            {message}
          </h1>
        }
        <div className="row-span-2 gap-4 p-4 flex items-center justify-center h-fit">
          {turns.priority === PlayersTurn.Player ? (
            playerActions.map((action) => action)
          ) : (
            <Button onClick={() => respondToAction(playSpell)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="1.5em"
                viewBox="0 0 512 512"
                fill={"white"}
              >
                <path d="M500.33 0h-47.41a12 12 0 0 0-12 12.57l4 82.76A247.42 247.42 0 0 0 256 8C119.34 8 7.9 119.53 8 256.19 8.1 393.07 119.1 504 256 504a247.1 247.1 0 0 0 166.18-63.91 12 12 0 0 0 .48-17.43l-34-34a12 12 0 0 0-16.38-.55A176 176 0 1 1 402.1 157.8l-101.53-4.87a12 12 0 0 0-12.57 12v47.41a12 12 0 0 0 12 12h200.33a12 12 0 0 0 12-12V12a12 12 0 0 0-12-12z" />
              </svg>
            </Button>
          )}
        </div>
        <div className="place-items-end row-span-1 self-end justify-end flex p-4">
          <Button onClick={() => passTurn()}>End Turn</Button>
        </div>
      </section>
    </main>
  );
}
