"use client";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { GameContext } from "../context/GameContext";

type MenuProps = {};
const Menu = ({}: MenuProps) => {
  console.log("menu");
  const { reset } = React.useContext(GameContext);
  const [showMenu, setShowMenu] = useState(false);
  const [closing, setClosing] = useState(false);
  const close = () => {
    setClosing(true);
    setTimeout(() => {
      setShowMenu(false);
      setClosing(false);
    }, 150);
  };

  return (
    <>
      <button onClick={() => setShowMenu((prev) => !prev)}>
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
            d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5"
          />
        </svg>
      </button>
      {showMenu && (
        <button
          onClick={close}
          className="bg-black bg-opacity-20 absolute z-50 transition-all duration-300 ease-in-out inset-0 flex justify-center items-center overflow-hidden text-center text-xs md:text-base"
        >
          {createPortal(
            <div
              onClick={(e) => e.stopPropagation()}
              className={`${
                !closing ? "animate-scale-in" : "animate-slide-out"
              } p-3 z-50 absolute inset-6 bg-gray-700  flex flex-col gap-6 text-white rounded-md border-2 backdrop-filter border-white`}
            >
              <button className="w-fit ml-auto" onClick={close}>
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <button onClick={() => reset()}>New Game</button>
            </div>,
            document.body
          )}
        </button>
      )}
    </>
  );
};

export default Menu;
