import * as React from 'react';
import { Platform, View, type ViewStyle } from 'react-native';
import type { BottomSheetBackgroundProps } from '@gorhom/bottom-sheet';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';

import { useTheme } from '../../theme';

export type StudioSheetBackgroundProps = BottomSheetBackgroundProps & {
  /**
   * Optional override to render a custom background (e.g. BlurView).
   * If provided, it receives the computed container style.
   */
  renderBackground?: (params: { style: ViewStyle }) => React.ReactNode;
};

export function StudioSheetBackground({
  style,
  renderBackground,
}: StudioSheetBackgroundProps) {
  const theme = useTheme();
  const radius = Platform.OS === 'ios' ? 39 : 16;
  const fallbackBgColor = theme.scheme === 'dark' ? 'rgba(11, 8, 15, 0.85)' : 'rgba(255, 255, 255, 0.85)';
  const secondaryBgBaseColor = theme.scheme === 'dark' ? 'rgb(24, 24, 27)' : 'rgb(173, 173, 173)';

  const containerStyle: ViewStyle = {
    ...(style as ViewStyle),
    borderTopLeftRadius: radius,
    borderTopRightRadius: radius,
    overflow: 'hidden',
  };

  if (renderBackground) {
    return <>{renderBackground({ style: containerStyle })}</>;
  }

  return (
    <>
      <LiquidGlassView
        style={[containerStyle, !isLiquidGlassSupported && { backgroundColor: fallbackBgColor }]}
        effect="regular"
      />
      {isLiquidGlassSupported && (
        <View
          style={[
            containerStyle,
            {
              backgroundColor: secondaryBgBaseColor,
              opacity: 0.4,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
            },
          ]}
        />
      )}
    </>
  );
}


