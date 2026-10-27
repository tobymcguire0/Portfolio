// Design tokens for the whole site. tailwind.config.mjs exposes them as Tailwind colors and
// fonts, and src/styles/global.css turns them into CSS variables through theme(), so editing
// a value here restyles both the hand-written CSS and any Tailwind utilities.
export const colors = {
  bg: 'oklch(99% 0.002 240)',
  surface: 'oklch(100% 0 0)',
  fg: 'oklch(18% 0.012 250)',
  'fg-2': 'oklch(36% 0.012 250)',
  muted: 'oklch(54% 0.012 250)',
  border: 'oklch(92% 0.005 250)',
  rule: 'oklch(86% 0.006 250)',
  sunk: 'oklch(97.5% 0.003 250)',
  accent: 'oklch(58% 0.18 255)',
  'accent-ink': 'oklch(48% 0.18 255)',
  ok: 'oklch(56% 0.14 152)',
  warn: 'oklch(60% 0.17 45)',
};

export const fonts = {
  display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'system-ui', 'sans-serif'],
  body: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'system-ui', 'sans-serif'],
  mono: ['ui-monospace', '"SF Mono"', '"Cascadia Code"', 'Menlo', 'Consolas', 'monospace'],
};
