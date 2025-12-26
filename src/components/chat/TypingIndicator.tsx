import * as React from 'react';
import { Animated, View, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme';

export type TypingIndicatorProps = {
  style?: ViewStyle;
};

export function TypingIndicator({ style }: TypingIndicatorProps) {
  const theme = useTheme();
  const dotColor = theme.colors.textSubtle;
  const anims = React.useMemo(
    () => [new Animated.Value(0.3), new Animated.Value(0.3), new Animated.Value(0.3)],
    []
  );

  React.useEffect(() => {
    const loops: Animated.CompositeAnimation[] = [];
    anims.forEach((a, idx) => {
      const seq = Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 420, useNativeDriver: true, delay: idx * 140 }),
        Animated.timing(a, { toValue: 0.3, duration: 420, useNativeDriver: true }),
      ]);
      const loop = Animated.loop(seq);
      loops.push(loop);
      loop.start();
    });
    return () => {
      loops.forEach((l) => l.stop());
    };
  }, [anims]);

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            marginHorizontal: 3,
            backgroundColor: dotColor,
            opacity: a,
            transform: [{ translateY: Animated.multiply(Animated.subtract(a, 0.3), 2) }],
          }}
        />
      ))}
    </View>
  );
}


