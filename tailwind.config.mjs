import { colors, fonts } from './theme.config.mjs';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  // src/styles/global.css relies on browser default element styles (paragraph margins,
  // list markers, heading sizes) that Preflight would reset.
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors,
      fontFamily: {
        display: fonts.display,
        sans: fonts.body,
        mono: fonts.mono,
      },
    },
  },
  plugins: [],
};
