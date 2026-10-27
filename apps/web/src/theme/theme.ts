import { createTheme } from '@mui/material/styles';
import { lightPalette, darkPalette } from './palette';
import { typography } from './typography';
import { components } from './components';

export const createAppTheme = (mode: 'light' | 'dark') => {
  return createTheme({
    palette: mode === 'light' ? lightPalette : darkPalette,
    typography,
    components,
    shape: {
      borderRadius: 8,
    },
  });
};
