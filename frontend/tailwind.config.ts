import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#F8FAFC",
        line: "rgba(148, 163, 184, 0.18)",
        panel: "rgba(11, 25, 42, 0.86)",
        "panel-soft": "rgba(15, 34, 55, 0.72)",
        brand: "#28D17C",
      },
    },
  },
  plugins: [],
} satisfies Config;
