import * as React from 'react';
import { type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme';
import { Surface } from './Surface';
import type { CardVariant, WithStyle } from './types';

export type CardProps = ViewProps &
  WithStyle<ViewStyle> & {
    variant?: CardVariant;
    padded?: boolean;
    border?: boolean;
  };

export function Card({ variant = 'surface', padded = true, border = true, style, ...props }: CardProps) {
  const theme = useTheme();
  const radius = theme.radii.lg;
  const padding = padded ? theme.spacing.lg : 0;

  return (
    <Surface
      {...props}
      variant={variant === 'surfaceRaised' ? 'surfaceRaised' : 'surface'}
      border={border}
      style={[{ borderRadius: radius, padding }, style]}
    />
  );
}


