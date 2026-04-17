export const themes = {
  default: {
    text: '#1C2127',
    surface: '#1C4B8F',
    accent: '#3148F6',
    background: '#E9E9E9',
  },
};

// Change this key to swap the site's base palette.
export const activeThemeName = 'default';

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, '0'))
    .join('')}`;
}

function mixColors(baseHex, mixHex, amount) {
  const base = hexToRgb(baseHex);
  const mix = hexToRgb(mixHex);

  return rgbToHex({
    r: base.r + (mix.r - base.r) * amount,
    g: base.g + (mix.g - base.g) * amount,
    b: base.b + (mix.b - base.b) * amount,
  });
}

function createAccentScale(accent, background, text) {
  return {
    DEFAULT: accent,
    50: mixColors(accent, background, 0.92),
    100: mixColors(accent, background, 0.84),
    200: mixColors(accent, background, 0.7),
    300: mixColors(accent, background, 0.52),
    400: mixColors(accent, background, 0.32),
    500: mixColors(accent, background, 0.14),
    600: accent,
    700: mixColors(accent, text, 0.18),
    800: mixColors(accent, text, 0.34),
    900: mixColors(accent, text, 0.5),
    950: mixColors(accent, '#000000', 0.64),
  };
}

function createSurfaceScale(surface, background) {
  return {
    DEFAULT: surface,
    50: mixColors(surface, background, 0.92),
    100: mixColors(surface, background, 0.84),
    200: mixColors(surface, background, 0.68),
    300: mixColors(surface, background, 0.5),
    400: mixColors(surface, background, 0.32),
    500: mixColors(surface, background, 0.16),
    600: surface,
    700: mixColors(surface, '#132746', 0.28),
    800: mixColors(surface, '#0d1b2f', 0.5),
    900: mixColors(surface, '#08111d', 0.72),
    950: mixColors(surface, '#03070c', 0.84),
  };
}

function createTextScale(text, background) {
  return {
    DEFAULT: text,
    50: mixColors(text, background, 0.95),
    100: mixColors(text, background, 0.88),
    200: mixColors(text, background, 0.76),
    300: mixColors(text, background, 0.62),
    400: mixColors(text, background, 0.48),
    500: mixColors(text, background, 0.34),
    600: mixColors(text, background, 0.22),
    700: mixColors(text, background, 0.12),
    800: mixColors(text, background, 0.05),
    900: text,
    950: mixColors(text, '#000000', 0.18),
  };
}

function createBackgroundScale(background, text) {
  return {
    DEFAULT: background,
    50: mixColors(background, '#ffffff', 0.4),
    100: background,
    200: mixColors(background, text, 0.08),
    300: mixColors(background, text, 0.14),
    400: mixColors(background, text, 0.2),
    500: mixColors(background, text, 0.28),
    600: mixColors(background, text, 0.38),
    700: mixColors(background, text, 0.5),
    800: mixColors(background, text, 0.62),
    900: mixColors(background, text, 0.76),
    950: mixColors(background, text, 0.88),
  };
}

export function buildThemeTokens(theme) {
  const accent = createAccentScale(theme.accent, theme.background, theme.text);
  const surface = createSurfaceScale(theme.surface, theme.background);
  const text = createTextScale(theme.text, theme.background);
  const background = createBackgroundScale(theme.background, theme.text);

  return {
    accent,
    surface,
    text,
    background,
  };
}

export const activeTheme = themes[activeThemeName];

if (!activeTheme) {
  throw new Error(`Unknown active theme: ${activeThemeName}`);
}

export const activeThemeTokens = buildThemeTokens(activeTheme);
