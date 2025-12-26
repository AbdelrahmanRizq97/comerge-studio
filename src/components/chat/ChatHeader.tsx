import * as React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { StudioSheetHeader } from '../studio-sheet/StudioSheetHeader';

export type ChatHeaderProps = {
  left?: React.ReactNode;
  right?: React.ReactNode;
  center?: React.ReactNode;
  style?: ViewStyle;
};

export function ChatHeader({ left, right, center, style }: ChatHeaderProps) {
  const flattenedStyle = StyleSheet.flatten([
    {
      paddingTop: 0,
    } satisfies ViewStyle,
    style,
  ]);

  return (
    <StudioSheetHeader
      left={left}
      right={right}
      center={center}
      style={flattenedStyle}
    />
  );
}


