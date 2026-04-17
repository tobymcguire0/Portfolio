import typography from '@tailwindcss/typography';
import { activeThemeTokens } from './theme.config.mjs';

const { accent, surface, text, background } = activeThemeTokens;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        accent,
        surface,
        text,
        background,
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': text[700],
            '--tw-prose-headings': text[950],
            '--tw-prose-links': accent[600],
            '--tw-prose-bold': text[900],
            '--tw-prose-counters': text[500],
            '--tw-prose-bullets': accent[400],
            '--tw-prose-hr': text[200],
            '--tw-prose-quotes': text[900],
            '--tw-prose-quote-borders': accent[200],
            '--tw-prose-captions': text[500],
            '--tw-prose-code': text[900],
            '--tw-prose-pre-code': background[50],
            '--tw-prose-pre-bg': surface[900],
            '--tw-prose-th-borders': text[200],
            '--tw-prose-td-borders': text[200],
          },
        },
        invert: {
          css: {
            '--tw-prose-invert-body': surface[100],
            '--tw-prose-invert-headings': background[50],
            '--tw-prose-invert-links': accent[100],
            '--tw-prose-invert-bold': background[50],
            '--tw-prose-invert-counters': surface[300],
            '--tw-prose-invert-bullets': surface[300],
            '--tw-prose-invert-hr': surface[700],
            '--tw-prose-invert-quotes': background[50],
            '--tw-prose-invert-quote-borders': surface[500],
            '--tw-prose-invert-captions': surface[300],
            '--tw-prose-invert-code': background[50],
            '--tw-prose-invert-pre-code': background[50],
            '--tw-prose-invert-pre-bg': surface[950],
            '--tw-prose-invert-th-borders': surface[700],
            '--tw-prose-invert-td-borders': surface[700],
          },
        },
      },
    },
  },
  plugins: [typography],
};
