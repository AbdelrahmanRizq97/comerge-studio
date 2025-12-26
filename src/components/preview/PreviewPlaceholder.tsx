import * as React from 'react';
import { Animated, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type PreviewPlaceholderProps = {
  visible: boolean;
  style?: ViewStyle;
};

export function PreviewPlaceholder({ visible, style }: PreviewPlaceholderProps) {
  if (!visible) return null;

  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!visible) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 2, duration: 1500, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 3, duration: 1500, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacityAnim, visible]);

  const opacity1 = opacityAnim.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [1, 0, 0, 0.3] });
  const opacity2 = opacityAnim.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [0, 1, 0, 0] });
  const opacity3 = opacityAnim.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [0, 0, 1, 0] });
  const opacity4 = opacityAnim.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [0, 0, 0, 1] });

  return (
    <>
      <Animated.View style={[{ position: 'absolute', inset: 0, opacity: opacity1 }, style]}>
        <LinearGradient
          colors={['rgba(98, 0, 238, 0.45)', 'rgba(168, 85, 247, 0.35)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: '100%', height: '100%' }}
        />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', inset: 0, opacity: opacity2 }, style]}>
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.45)', 'rgba(139, 92, 246, 0.35)']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ width: '100%', height: '100%' }}
        />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', inset: 0, opacity: opacity3 }, style]}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.45)', 'rgba(126, 34, 206, 0.35)']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={{ width: '100%', height: '100%' }}
        />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', inset: 0, opacity: opacity4 }, style]}>
        <LinearGradient
          colors={['rgba(126, 34, 206, 0.45)', 'rgba(98, 0, 238, 0.35)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ width: '100%', height: '100%' }}
        />
      </Animated.View>
    </>
  );
}


