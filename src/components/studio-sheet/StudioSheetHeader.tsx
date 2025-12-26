import * as React from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme';

export type StudioSheetHeaderProps = {
  left?: React.ReactNode;
  right?: React.ReactNode;
  center?: React.ReactNode;
  style?: ViewStyle;
};

export function StudioSheetHeader({ left, center, right, style }: StudioSheetHeaderProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.sm,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>{left}</View>
      <View style={{ flex: 1, alignItems: 'center' }}>{center}</View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>{right}</View>
    </View>
  );
}


