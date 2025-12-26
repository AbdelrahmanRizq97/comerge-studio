export type ThemeScheme = 'light' | 'dark';


export type ThemeColors = {
  text: string;
  textMuted: string;
  textSubtle: string;

  background: string;
  surface: string;
  surfaceRaised: string;

  border: string;
  borderStrong: string;

  primary: string;
  onPrimary: string;

  neutral: string;
  onNeutral: string;

  danger: string;
  onDanger: string;
  dangerSubtle: string;

  success: string;
  onSuccess: string;
  successSubtle: string;

  warning: string;
  onWarning: string;
  warningSubtle: string;

  link: string;

  backdrop: string;

  handleIndicator: string;

  floatingSurface: string;
  floatingContent: string;

  accentRingFrom: string;
  accentRingTo: string;
  dangerRingFrom: string;
  dangerRingTo: string;
};

export type Theme = {
  scheme: ThemeScheme;
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radii: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  typography: {
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
    lineHeight: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
    fontWeight: {
      regular: '400' | '500';
      medium: '500' | '600';
      semibold: '600' | '700';
      bold: '700';
    };
  };
};


