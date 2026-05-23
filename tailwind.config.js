/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "rgb(var(--terminal-bg) / <alpha-value>)",
          panel: "rgb(var(--terminal-panel) / <alpha-value>)",
          panel2: "rgb(var(--terminal-panel2) / <alpha-value>)",
          line: "rgb(var(--terminal-line) / <alpha-value>)",
          glow: "rgb(var(--terminal-glow) / <alpha-value>)",
          text: "rgb(var(--terminal-text) / <alpha-value>)",
          muted: "rgb(var(--terminal-muted) / <alpha-value>)",
          sidebar: "rgb(var(--terminal-sidebar) / <alpha-value>)"
        }
      },
      boxShadow: {
        glow: "0 0 28px rgba(104, 240, 169, 0.12)"
      }
    }
  },
  plugins: []
};
