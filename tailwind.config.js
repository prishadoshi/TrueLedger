/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/globals.css"
  ],
  theme: {
    extend: {
      colors: {
        destructive: "oklch(0.577 0.245 27.325)",
        background: "oklch(1 0 0)",
        foreground: "oklch(0.145 0 0)",
        ring: "oklch(0.708 0 0)",
        border: "oklch(0.922 0 0)",
        primary: "oklch(0.205 0 0)",
        "primary-foreground": "oklch(0.985 0 0)",
      },
    },
  },
  plugins: [],
};
