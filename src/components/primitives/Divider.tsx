import * as React from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme';
import type { DividerVariant, WithStyle } from './types';

export type DividerProps = WithStyle<ViewStyle> & {
  variant?: DividerVariant;
};

export function Divider({ variant = 'default', style }: DividerProps) {
  const theme = useTheme();
  const color = variant === 'subtle' ? theme.colors.border : theme.colors.borderStrong;
  return <View style={[{ height: 1, backgroundColor: color }, style]} />;
}


