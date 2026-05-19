import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        logo: ["var(--font-rozha)", "serif"],
        sans: [
          "var(--font-montserrat)",
          "var(--font-noto-sans-kr)",
          "sans-serif",
        ],
        body: [
          '"Avenir Light"',
          '"Avenir Next"',
          "Avenir",
          "var(--font-montserrat)",
          "var(--font-noto-sans-kr)",
          "sans-serif",
        ],
      },
      transitionDuration: {
        motion: "450ms",
        "motion-fast": "220ms",
      },
      transitionTimingFunction: {
        calm: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)",
        },
        page: {
          bg: "rgb(var(--page-bg) / <alpha-value>)",
          heading: "rgb(var(--page-heading) / <alpha-value>)",
          body: "rgb(var(--page-body) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
