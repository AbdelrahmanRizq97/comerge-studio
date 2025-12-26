import { useColorScheme } from 'react-native';

import { themes } from './tokens';
import type { Theme, ThemeScheme } from './types';

export function useTheme(): Theme {
  const scheme = (useColorScheme() ?? 'light') as ThemeScheme;
  return themes[scheme] ?? themes.light;
}


