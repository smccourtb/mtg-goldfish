"use client";
import React, { useEffect, useState } from "react";

type LifeTrackerProps = {
  color: {
    background: string;
    text: string;
    active: string;
  };
  reset?: boolean;
  active?: boolean;
  startingLife?: number;
};
const LifeTracker = ({
  color,
  reset,
  active,
  startingLife,
}: LifeTrackerProps) => {
  const [life, setLife] = useState(startingLife ?? 40);

  useEffect(() => {
    if (reset) setLife(startingLife ?? 40);
  }, [reset]);

  return (
    <div
      role={"button"}
      className={`${active ? "animate-pulse" : ""} ${color.background} ${
        color.text
      } font-bold relative flex flex-col flex-1 rounded-md select-none overflow-hidden text-6xl`}
    >
      <button
        className={`flex flex-1 ${color.active}`}
        onClick={() => setLife((prev) => prev + 1)}
      />
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {life}
      </span>
      <button
        className={`flex flex-1 ${color.active}`}
        onClick={() => setLife((prev) => prev - 1)}
      />
    </div>
  );
};

export default LifeTracker;
