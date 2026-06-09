import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202A",
        line: "#D8DEE8",
        panel: "#F7F9FC",
        brand: "#0E7C86",
      },
    },
  },
  plugins: [],
} satisfies Config;
