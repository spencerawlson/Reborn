import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // Brand navy (deep, premium) — used for hero, CTA band, footer.
        navy: {
          950: "#06112a",
          900: "#0b1b3f",
          800: "#12275a",
          700: "#1b3575",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
