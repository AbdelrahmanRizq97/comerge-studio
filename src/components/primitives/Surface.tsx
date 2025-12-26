import * as React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme';
import type { SurfaceVariant, WithStyle } from './types';

export type SurfaceProps = ViewProps &
  WithStyle<ViewStyle> & {
    variant?: SurfaceVariant;
    border?: boolean;
  };

function backgroundFor(variant: SurfaceVariant, theme: ReturnType<typeof useTheme>): string {
  const { colors } = theme;
  switch (variant) {
    case 'background':
      return colors.background;
    case 'surfaceRaised':
      return colors.surfaceRaised;
    case 'floating':
      return colors.floatingSurface;
    case 'surface':
    default:
      return colors.surface;
  }
}

export function Surface({ variant = 'surface', border = false, style, ...props }: SurfaceProps) {
  const theme = useTheme();
  return (
    <View
      {...props}
      style={[
        { backgroundColor: backgroundFor(variant, theme) },
        border ? { borderWidth: 1, borderColor: theme.colors.border } : null,
        style,
      ]}
    />
  );
}


