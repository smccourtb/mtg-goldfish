import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
};
const Button = ({ children, onClick }: ButtonProps) => {
  return (
    <button
      className="border border-white rounded-md px-2 py-1 active:bg-white active:bg-opacity-10 font-semibold text-white"
      onClick={() => {
        onClick();
      }}
    >
      {children}
    </button>
  );
};

export default Button;
