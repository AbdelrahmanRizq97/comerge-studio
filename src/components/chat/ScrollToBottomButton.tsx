import * as React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '../../theme';
import { withAlpha } from '../utils/color';

export type ScrollToBottomButtonProps = {
  visible: boolean;
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function ScrollToBottomButton({ visible, onPress, children, style }: ScrollToBottomButtonProps) {
  const theme = useTheme();
  const progress = useSharedValue(visible ? 1 : 0);
  const [pressed, setPressed] = React.useState(false);

  React.useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: 200, easing: Easing.out(Easing.ease) });
  }, [progress, visible]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 20 }],
  }));

  const bg = theme.scheme === 'dark' ? 'rgba(39,39,42,0.9)' : 'rgba(244,244,245,0.95)';
  const border = theme.scheme === 'dark' ? withAlpha('#FFFFFF', 0.12) : withAlpha('#000000', 0.08);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          alignItems: 'center',
        },
        style,
        animStyle,
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: border,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
          opacity: pressed ? 0.85 : 1,
        }}
      >
        <Pressable
          onPress={onPress}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          hitSlop={10}
          style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
        >
          {children}
        </Pressable>
      </View>
    </Animated.View>
  );
}


