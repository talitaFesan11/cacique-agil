import { PaletteOptions } from '@mui/material/styles';

export const lightPalette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: '#2563EB', // Indigo Blue principal
    light: '#60A5FA',
    dark: '#1D4ED8',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#7C3AED', // Purple
    light: '#A78BFA',
    dark: '#5B21B6',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F8FAFC',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
  },
  divider: '#E2E8F0',
};

export const darkPalette: PaletteOptions = {
  mode: 'dark',
  primary: {
    main: '#3B82F6',
    light: '#93C5FD',
    dark: '#1D4ED8',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#8B5CF6',
    light: '#C4B5FD',
    dark: '#6D28D9',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#0B0F19',
    paper: '#111827',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#94A3B8',
  },
  divider: '#1E293B',
};
