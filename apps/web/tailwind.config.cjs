/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Dunkles, leicht futuristisches Gaming-Theme
        background: "#05060a",
        surface: "#0f1117",
        accent: "#22d3ee",     // Neon-Cyan
        accentPurple: "#a855f7",
        muted: "#6b7280",
        border: "#1f2933"
      },
      boxShadow: {
        "soft-neon": "0 0 20px rgba(34,211,238,0.35)"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem"
      }
    }
  },
  plugins: []
};
