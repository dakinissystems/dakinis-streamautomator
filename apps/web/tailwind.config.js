/** @type {import('tailwindcss').Config} */
const path = require("path");

let desExtend = {};
try {
  // Monorepo: packages/shared-brand (optional if repo ships alone)
  const preset = require(path.resolve(
    __dirname,
    "../../../../packages/shared-theme/src/tailwind-preset.cjs"
  ));
  desExtend = preset.desTailwindThemeExtend || preset.default || {};
} catch {
  desExtend = {
    colors: {
      surface: {
        0: "#08111d",
        1: "#122840",
        2: "#17344e",
        DEFAULT: "#122840",
      },
      accent: { DEFAULT: "#3b82f6", dark: "#2563eb" },
      ink: { DEFAULT: "#f0f4f9", muted: "#b8c6d9" },
      line: "#23415f",
    },
    borderRadius: { card: "16px" },
  };
}

module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      ...desExtend,
      colors: {
        ...(desExtend.colors || {}),
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1e40af",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        twitch: "#9146FF",
        twitter: "#1DA1F2",
        instagram: "#E4405F",
        discord: "#5865F2",
      },
      fontFamily: {
        ...(desExtend.fontFamily || {}),
        sans: [
          "var(--dakinis-font-sans)",
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
