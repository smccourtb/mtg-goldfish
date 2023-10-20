import React from "react";
import { OpponentCreature } from "../types";

type CardProps = {
  creature: OpponentCreature;
  destroyCreature: () => void;
  tapCreature: () => void;
  blockCreature: () => void;
};

const keyWordToIcon: { [key: string]: string } = {
  infect: "ms-ability-toxic",
  vigilance: "ms-ability-vigilance",
  trample: "ms-ability-trample",
  lifelink: "ms-ability-lifelink",
  haste: "ms-ability-haste",
  flying: "ms-ability-flying",
  "first strike": "ms-ability-first-strike",
  "double strike": "ms-ability-double-strike",
  deathtouch: "ms-ability-deathtouch",
  defender: "ms-ability-defender",
  reach: "ms-ability-reach",
  indestructible: "ms-ability-indestructible",
  hexproof: "ms-ability-hexproof",
  flash: "ms-ability-flash",
  menace: "ms-ability-menace",
  protection: "ms-ability-protection",
  prowess: "ms-ability-prowess",
  scry: "ms-ability-scry",
  skulk: "ms-ability-skulk",
  surveil: "ms-ability-surveil",
  transform: "ms-ability-transform",
  unblockable: "ms-ability-unblockable",
  unearth: "ms-ability-unearth",
  unleash: "ms-ability-unleash",
  vanishing: "ms-ability-vanishing",
  annihilator: "ms-ability-annihilator",
  absorb: "ms-ability-absorb",
  affinity: "ms-ability-affinity",
};

const Card = ({
  creature,
  destroyCreature,
  tapCreature,
  blockCreature,
}: CardProps) => {
  return (
    <div
      className={`${
        creature.isTapped
          ? "rotate-90 scale-75 shadow-sm"
          : "rotate-0 shadow-xl"
      } animate-scale-in relative transition-all duration-200 ease-in-out flex flex-col border-2 border-white rounded-sm p-1 w-[75px] h-[100px] sm:w-[100px] sm:h-[150px] justify-between text-xs sm:text-base`}
      onClick={tapCreature}
    >
      {creature.hasSummoningSickness && (
        <i className="absolute top-1 left-2 ms ms-2x ms-counter-stun animate-pulse duration-1000 w-fit" />
      )}
      <button
        className="px-0.5 flex item-start w-fit self-end text-xs text-white flex justify-center font-bold"
        onClick={(e) => {
          e.stopPropagation();
          destroyCreature();
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      {creature.ability && (
        <span className="flex items-center justify-center text-[.75em] md:text-base capitalize font-bold drop-shadow-sm p-1 h-full text-center">
          <i
            title={creature.ability}
            className={`ms ${
              keyWordToIcon[creature.ability] ?? creature.ability
            } ms-2x`}
          />
        </span>
      )}
      <button
        className="flex items-center justify-center text-[.75em] md:text-base capitalize font-bold drop-shadow-sm p-1 h-full text-center"
        onClick={(e) => {
          e.stopPropagation();
          blockCreature();
        }}
      >
        <i
          className={`ms ${
            creature.hasBlocked
              ? "ms-defense text-gray-100"
              : "ms-defense-outline"
          } ms-2x w-fit`}
        />
      </button>
      <span className="self-end bg-white rounded-sm px-1 text-green-500 font-bold text-xs md:text-base">{`${creature.power}/${creature.toughness}`}</span>
    </div>
  );
};

export default Card;
