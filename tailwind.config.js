/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
    animation: {
      "slide-in": "slide-in 0.2s ease-in-out",
      "slide-out": "slide-out 0.2s ease-in-out",
      "scale-in": "scale-in 0.2s ease-in-out",
    },
    keyframes: {
      "slide-in": {
        "0%": {
          opacity: 0,
          transform: "translateY(100%)",
        },
        "100%": {
          transform: "translateY(0)",
          opacity: 1,
        },
      },
      "slide-out": {
        "0%": {
          transform: "translateY(0)",
        },
        "100%": {
          transform: "translateY(100%)",
        },
      },
      "scale-in": {
        "0%": {
          transform: "scale(0)",
          opacity: 0,
        },
        "100%": {
          transform: "scale(1)",
          opacity: 1,
        },
      },
    },
  },
  plugins: [],
};
