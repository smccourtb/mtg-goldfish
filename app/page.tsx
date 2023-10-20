import Game from "../components/Game";
export default function Page() {
  return (
    <main className="flex flex-col h-screen w-screen bg-gray-700">
      <header className="bg-gray-700 text-white h-1/12 flex justify-between items-center p-2">
        <h1 className="text-base md:text-2xl font-bold">Goldfish</h1>
        <button>
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
      </header>
      <Game />
    </main>
  );
}
