/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ["Poppins", "Inter", "ui-sans-serif", "system-ui"],
    },
    extend: {
      colors: {
        "neon-cyan": "#00fff7",
        "neon-blue": "#0b84ff",
        "neon-violet": "#a259ff",
        "neon-green": "#16ff6e",
        "neon-red": "#ff3b6a",
        glass: "rgba(23, 32, 54, 0.35)",
      },
      boxShadow: {
        neon: "0 0 16px 2px #00fff7, 0 0 32px 4px #0b84ff",
        "neon-violet": "0 0 16px 2px #a259ff",
        "neon-green": "0 0 16px 2px #16ff6e",
        "neon-red": "0 0 16px 2px #ff3b6a",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "fade-in": "fadeIn 1s ease",
        float: "float 3s ease-in-out infinite",
        "star-twinkle": "starTwinkle 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        starTwinkle: {
          "0%, 100%": { opacity: 0.8 },
          "50%": { opacity: 1 },
        },
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "2rem",
      },
    },
  },
  plugins: [],
};
