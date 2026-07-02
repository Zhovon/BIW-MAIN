import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  corePlugins: {
    // Disable preflight so it doesn't break their existing vanilla CSS headers/layouts
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
