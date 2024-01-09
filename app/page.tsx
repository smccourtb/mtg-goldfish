import Game from "../components/Game";
import { createPortal } from "react-dom";
import Menu from "../components/Menu";
import { GameProvider } from "../context/GameContext";

export default function Page() {
  console.log("page");
  return (
    <main id="app" className="flex flex-col h-screen w-screen bg-gray-700">
      <GameProvider>
        <header className="bg-gray-700 text-white h-1/12 flex justify-between items-center p-2">
          <h1 className="text-base md:text-2xl font-bold">Goldfish</h1>
          <Menu />
        </header>
        <Game />
      </GameProvider>
    </main>
  );
}
