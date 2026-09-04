import { DarkTheme, type Theme } from 'expo-router/react-navigation';

// Pantry List dark-monochrome tokens (spec §10.2). Dark-only for MVP
// (Task 9 decision) - mirrors the HSL values in src/global.css, expressed
// here as plain hex/rgba for React Navigation's chrome (headers, tab bars)
// which doesn't go through NativeWind/Tailwind.
export const THEME = {
  background: '#0A0A0A',
  foreground: '#FAFAFA',
  card: '#111111',
  cardForeground: '#FAFAFA',
  popover: '#111111',
  popoverForeground: '#FAFAFA',
  primary: '#FAFAFA',
  primaryForeground: '#0A0A0A',
  secondary: '#202020',
  secondaryForeground: '#FAFAFA',
  muted: '#202020',
  mutedForeground: '#A1A1AA',
  accent: '#202020',
  accentForeground: '#FAFAFA',
  destructive: '#EF4444',
  destructiveForeground: '#FAFAFA',
  border: '#27272A',
  input: '#27272A',
  ring: '#3F3F46',
  radius: '0.875rem',
  elevated: '#181818',
  borderStrong: '#3F3F46',
  dimForeground: '#71717A',
};

export const NAV_THEME: Theme = {
  ...DarkTheme,
  colors: {
    background: THEME.background,
    border: THEME.border,
    card: THEME.card,
    notification: THEME.destructive,
    primary: THEME.primary,
    text: THEME.foreground,
  },
};
