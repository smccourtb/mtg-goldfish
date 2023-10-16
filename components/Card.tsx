import React from "react";
import { OpponentCreature } from "../types";

type CardProps = {
  creature: OpponentCreature;
  destroyCreature: () => void;
  tapCreature: () => void;
};
const Card = ({ creature, destroyCreature, tapCreature }: CardProps) => {
  return (
    <div
      className={`${
        creature.isTapped ? "rotate-90 scale-75" : "rotate-0"
      } transition-all duration-200 ease-in-out flex flex-col border-2 border-white rounded-sm p-1 w-[75px] h-[100px] sm:w-[100px] sm:h-[150px] justify-between text-xs sm:text-base shadow-xl`}
      onClick={tapCreature}
    >
      <button
        className="px-0.5 flex item-start w-fit self-end text-xs text-white flex justify-center font-bold "
        onClick={(e) => {
          e.stopPropagation();
          destroyCreature();
        }}
      >
        X
      </button>
      <span className="text-[.75em] md:text-base capitalize font-bold drop-shadow-sm p-1 h-full text-center">
        {creature.ability}
      </span>

      <span className="self-end bg-white rounded-sm px-1 text-green-500 font-bold text-xs md:text-base">{`${creature.power}/${creature.toughness}`}</span>
    </div>
  );
};

export default Card;
