import type * as React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

type RemixXLoopLottieProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

const remixXLoopSource = require('../../assets/lottie/remix-x-loop.lottie.json');
const Lottie = LottieView as unknown as React.ComponentType<any>;

export function RemixXLoopLottie({ size = 24, style }: RemixXLoopLottieProps) {
  return (
    <Lottie
      source={remixXLoopSource}
      autoPlay
      loop
      style={[{ width: size, height: size }, style]}
    />
  );
}
