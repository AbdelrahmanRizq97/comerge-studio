import * as React from 'react';
import { View, type ViewStyle } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { useTheme } from '../../theme';

export type PreviewPageProps = {
  header?: React.ReactNode;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
};

export function PreviewPage({ header, children, contentStyle }: PreviewPageProps) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1 }}>
      {header ? <View>{header}</View> : null}
      <BottomSheetScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          {
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.xl,
            flexGrow: 1,
          },
          contentStyle,
        ]}
      >
        {children}
      </BottomSheetScrollView>
    </View>
  );
}


