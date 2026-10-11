/**
 * AAWRO design tokens (white / blue / professional), taken from the
 * prototype's token layer. "accent-2" is the green used for verified,
 * confirmed and money states.
 */
export const c = {
  bg: '#f4f7fb',
  surface: '#ffffff',
  text: '#0f172a',
  divider: '#e5eaf1',

  n100: '#ffffff',
  n200: '#eef2f7',
  n300: '#dce3ed',
  n400: '#c2ccda',
  n500: '#94a3b8',
  n600: '#64748b',
  n700: '#475569',
  n800: '#334155',
  n900: '#0f172a',

  a100: '#eff6ff',
  a200: '#dbeafe',
  a300: '#bfdbfe',
  a400: '#7ba9f8',
  a500: '#3b82f6',
  a600: '#2563eb',
  a700: '#1d4ed8',
  a800: '#1a3fae',
  a900: '#16307c',

  g100: '#ecfdf5',
  g200: '#d1fae5',
  g300: '#a7f3d0',
  g400: '#52c99a',
  g500: '#10b981',
  g600: '#059669',
  g700: '#047857',
  g800: '#065f46',
  g900: '#064e3b',

  accent: '#2563eb',
  danger: '#dc2626',
  warning: '#d97706',
  scrim: 'rgba(15,23,42,0.42)',
};

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  heavy: 'Inter_800ExtraBold',
};

export const shadow = {
  sm: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  lg: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
};

/** Booking status badge colours keyed by the API's `statusTone`. */
export const tone: Record<string, { bg: string; fg: string }> = {
  blue: { bg: c.a200, fg: c.a800 },
  green: { bg: c.g200, fg: c.g900 },
  amber: { bg: c.a300, fg: c.a900 },
  grey: { bg: c.n300, fg: c.n800 },
  red: { bg: '#fee2e2', fg: '#991b1b' },
};

/** Soft fills used behind initials and glyph tiles. */
export const tiles = [c.a300, c.g300, c.n300, c.a200];
