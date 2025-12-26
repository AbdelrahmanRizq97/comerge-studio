import * as React from 'react';
import { Animated, type ViewStyle } from 'react-native';

import type { StudioSheetPage } from './types';

export type StudioSheetPagerProps = {
  activePage: StudioSheetPage;
  width: number;
  preview: React.ReactNode;
  chat: React.ReactNode;
  style?: ViewStyle;
};

export function StudioSheetPager({ activePage, width, preview, chat, style }: StudioSheetPagerProps) {
  const anim = React.useRef(new Animated.Value(activePage === 'chat' ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(anim, {
      toValue: activePage === 'chat' ? 1 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [activePage, anim]);

  const previewTranslateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -width] });
  const chatTranslateX = anim.interpolate({ inputRange: [0, 1], outputRange: [width, 0] });

  return (
    <Animated.View style={[{ flex: 1 }, style]}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: [{ translateX: previewTranslateX }],
          },
        ]}
        pointerEvents={activePage === 'preview' ? 'auto' : 'none'}
      >
        {preview}
      </Animated.View>

      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: [{ translateX: chatTranslateX }],
          },
        ]}
        pointerEvents={activePage === 'chat' ? 'auto' : 'none'}
      >
        {chat}
      </Animated.View>
    </Animated.View>
  );
}


