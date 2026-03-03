/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#8a0000",
        "primary-dark": "#5e0000",
        secondary: "#2b2b2b",
        paper: "#fcf8f3",
        "paper-dark": "#e8e0d5",
        accent: "#d4af37",
        ink: "#1d0c0c",
        "ink-light": "#4a3b3b",
      },
      fontFamily: {
        display: ["'Noto Serif SC'", "serif"],
        mono: ["'Courier New'", "monospace"],
      },
      backgroundImage: {
        'paper-texture': "url('https://www.transparenttextures.com/patterns/cream-paper.png')",
        'vintage-grid': "linear-gradient(#eacdcd 1px, transparent 1px), linear-gradient(90deg, #eacdcd 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
}
