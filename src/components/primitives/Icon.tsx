import * as React from 'react';

import { useTheme } from '../../theme';
import type { IconColorRole } from './types';

export type IconProps = {
  /**
   * Any icon component that supports `color` and `size` props (e.g. lucide-react-native).
   */
  as: React.ComponentType<{ color?: string; size?: number }>;
  size?: number;
  role?: IconColorRole;
  color?: string;
};

function colorFor(role: IconColorRole, theme: ReturnType<typeof useTheme>): string {
  const { colors } = theme;
  switch (role) {
    case 'muted':
      return colors.textMuted;
    case 'primary':
      return colors.primary;
    case 'danger':
      return colors.danger;
    case 'success':
      return colors.success;
    case 'warning':
      return colors.warning;
    case 'default':
    default:
      return colors.text;
  }
}

export function Icon({ as: Comp, size = 18, role = 'default', color }: IconProps) {
  const theme = useTheme();
  return <Comp size={size} color={color ?? colorFor(role, theme)} />;
}


