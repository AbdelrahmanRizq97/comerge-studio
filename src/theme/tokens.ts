import type { Theme } from './types';

export const lightTheme = {
  scheme: 'light',
  colors: {
    text: '#09090B',
    textMuted: '#898994',
    textSubtle: 'rgba(137, 137, 148, 0.70)',

    background: '#FFFFFF',
    surface: '#F6F6F6',
    surfaceRaised: '#FFFFFF',

    border: '#E4E4E7',
    borderStrong: '#D4D4D8',

    primary: '#00CBC0',
    onPrimary: '#FFFFFF',

    neutral: '#ECECEE',
    onNeutral: '#09090B',

    danger: '#F43F5E',
    onDanger: '#FFFFFF',
    dangerSubtle: 'rgba(244, 63, 94, 0.12)',

    success: '#10B981',
    onSuccess: '#FFFFFF',
    successSubtle: 'rgba(16, 185, 129, 0.12)',

    warning: '#FACC15',
    onWarning: '#09090B',
    warningSubtle: 'rgba(250, 204, 21, 0.14)',

    link: '#00CBC0',

    backdrop: 'rgba(0, 0, 0, 0.35)',

    handleIndicator: '#71717A',

    floatingSurface: 'rgba(255, 255, 255, 0.6)',
    floatingContent: '#000000',

    accentRingFrom: 'rgba(0, 203, 192, 0.20)',
    accentRingTo: 'rgba(0, 203, 192, 0.90)',
    dangerRingFrom: 'rgba(244, 63, 94, 0.35)',
    dangerRingTo: 'rgba(244, 63, 94, 1.0)',
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  radii: { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 },
  typography: {
    fontSize: { xs: 12, sm: 13, md: 15, lg: 17, xl: 20 },
    lineHeight: { xs: 16, sm: 18, md: 20, lg: 22, xl: 26 },
    fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  },
} as const satisfies Theme;

export const darkTheme = {
  scheme: 'dark',
  colors: {
    text: '#FFFFFF',
    textMuted: '#A1A1AA',
    textSubtle: 'rgba(161, 161, 170, 0.70)',

    background: '#0B080F',
    surface: '#18181B',
    surfaceRaised: '#0B080F',

    border: '#404049',
    borderStrong: '#52525B',

    primary: '#00CBC0',
    onPrimary: '#FFFFFF',

    neutral: '#0B080F',
    onNeutral: '#FFFFFF',

    danger: '#F43F5E',
    onDanger: '#FFFFFF',
    dangerSubtle: 'rgba(244, 63, 94, 0.18)',

    success: '#10B981',
    onSuccess: '#0B080F',
    successSubtle: 'rgba(16, 185, 129, 0.16)',

    warning: '#FBBF24',
    onWarning: '#0B080F',
    warningSubtle: 'rgba(251, 191, 36, 0.18)',

    link: '#00CBC0',

    backdrop: 'rgba(0, 0, 0, 0.55)',

    handleIndicator: '#A1A1AA',

    floatingSurface: 'rgba(0, 0, 0, 0.6)',
    floatingContent: '#FFFFFF',

    accentRingFrom: 'rgba(0, 203, 192, 0.20)',
    accentRingTo: 'rgba(0, 203, 192, 0.90)',
    dangerRingFrom: 'rgba(244, 63, 94, 0.35)',
    dangerRingTo: 'rgba(244, 63, 94, 1.0)',
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  radii: { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 },
  typography: {
    fontSize: { xs: 12, sm: 13, md: 15, lg: 17, xl: 20 },
    lineHeight: { xs: 16, sm: 18, md: 20, lg: 22, xl: 26 },
    fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  },
} as const satisfies Theme;

export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;


