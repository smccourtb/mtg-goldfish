"use client";
import LifeTracker from "../../components/LifeTracker";
import React, { useState } from "react";
export default function Page() {
  const [startingLife, setStartingLife] = useState(20);
  const [reset, setReset] = useState(false);

  const handleReset = () => {
    setStartingLife(20);
    setReset((prev) => !prev);
  };

  return (
    <main className="flex flex-col h-screen w-screen bg-gray-700">
      <section className="h-screen flex">
        <button
          onClick={handleReset}
          className="absolute left-1/2 top-10 transform -translate-x-1/2 bg-gray-700 z-50 text-white font-bold rounded-md px-2 py-1 active:bg-white active:bg-opacity-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
        </button>
        <LifeTracker
          reset={reset}
          color={{
            background: "bg-blue-500",
            active: "active:bg-blue-600",
            text: "text-white",
          }}
          startingLife={startingLife}
        />
        <LifeTracker
          reset={reset}
          color={{
            background: "bg-red-500",
            active: "active:bg-red-600",
            text: "text-gray-900",
          }}
          startingLife={startingLife}
        />
      </section>
    </main>
  );
}
