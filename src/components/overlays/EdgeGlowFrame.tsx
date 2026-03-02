import * as React from 'react';
import { Animated, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../theme';
import { withAlpha } from '../utils/color';

export type EdgeGlowFrameProps = {
  visible: boolean;
  /**
   * Which semantic color to use for the glow.
   */
  role?: 'accent' | 'danger' | 'success' | 'warning';
  /**
   * Thickness of each edge glow in dp.
   */
  thickness?: number;
  /**
   * Optional intensity multiplier for alpha (0..1).
   */
  intensity?: number;
  /**
   * Opacity animation duration in ms.
   */
  animationDurationMs?: number;
  style?: ViewStyle;
};

function baseColor(role: NonNullable<EdgeGlowFrameProps['role']>, theme: ReturnType<typeof useTheme>) {
  switch (role) {
    case 'danger':
      return theme.colors.danger;
    case 'success':
      return theme.colors.success;
    case 'warning':
      return theme.colors.warning;
    case 'accent':
    default:
      return theme.colors.primary;
  }
}

export function EdgeGlowFrame({
  visible,
  role = 'accent',
  thickness = 40,
  intensity = 1,
  animationDurationMs = 300,
  style,
}: EdgeGlowFrameProps) {
  const theme = useTheme();
  const alpha = Math.max(0, Math.min(1, intensity));

  const anim = React.useRef(new Animated.Value(visible ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: animationDurationMs,
      useNativeDriver: true,
    }).start();
  }, [anim, visible, animationDurationMs]);

  const c = baseColor(role, theme);
  const strong = withAlpha(c, 0.6 * alpha);
  const soft = withAlpha(c, 0.22 * alpha);

  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', inset: 0, opacity: anim }, style]}>
      {/* Top */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: thickness }}>
        <LinearGradient
          colors={[strong, soft, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
      {/* Bottom */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: thickness }}>
        <LinearGradient
          colors={['transparent', soft, strong]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
      {/* Left */}
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: thickness }}>
        <LinearGradient
          colors={[strong, soft, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
      {/* Right */}
      <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: thickness }}>
        <LinearGradient
          colors={['transparent', soft, strong]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    </Animated.View>
  );
}


