import React from "react";
import { OpponentStats } from "../types";

type StatBarProps = {
  stats: OpponentStats;
  turn: number;
  priorityName: string;
};
const StatBar = ({ stats, turn, priorityName }: StatBarProps) => {
  return (
    <>
      <div className="text-xs md:text-base font-bold">
        <i className="ms ms-2x scale-75 mb-1.5 ms-tap-alt mr-1 font-bold" />
        {turn}
      </div>
      {stats.handSize && (
        <span
          className={`${
            stats.handSize ? "scale-100" : "scale-0"
          } text-xs md:text-base font-bold transform transition-all duration-200 ease-in-out`}
        >
          <i className="ms ms-2x scale-75 mb-0.5 ms-ability-transform mr-1 font-bold" />
          <span className="align-baseline">{stats.handSize}</span>
        </span>
      )}
      <span className="text-xs md:text-base font-bold">
        <i className="ms ms-cost ms-c mr-1 ms-2x scale-75 mb-0.5" />
        {stats.availableMana}
      </span>
      <span className="text-xs md:text-base font-bold">
        <i className="ms ms-planeswalker mr-1 ms-2x mb-0.5" />
        {priorityName}
      </span>
    </>
  );
};

export default StatBar;
