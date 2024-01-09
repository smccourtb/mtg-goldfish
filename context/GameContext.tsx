"use client";
import React, { ReactNode, useState } from "react";
import { commander } from "../configs/setup";
const gameSettings = {
  gameType: commander,
  reset: () => {},
};
export const GameContext = React.createContext(gameSettings);

export const GameProvider = ({ children }: { children: ReactNode[] }) => {
  const [gameType, setGameType] = useState(commander);
  console.log("context");

  const reset = () => {
    setGameType(commander);
  };

  return (
    <GameContext.Provider value={{ gameType, reset }}>
      {children}
    </GameContext.Provider>
  );
};

// create
