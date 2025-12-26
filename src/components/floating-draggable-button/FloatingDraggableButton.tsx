import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  type GestureResponderEvent,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';

import { DEFAULT_EDGE_PADDING, DEFAULT_OFFSET, DEFAULT_SIZE, ENTER_ROTATION_FROM_DEG, ENTER_SCALE_FROM, HIDDEN_OPACITY, PULSE_DURATION_MS } from './constants';
import type { FloatingDraggableButtonProps } from './types';
import { useTheme } from '../../theme';

const HIDDEN_OFFSET_X = 20;

const SPRING_POSITION = { damping: 12, stiffness: 100, mass: 0.8 } as const;
const SPRING_SCALE_IN = { damping: 10, stiffness: 200 } as const;
const SPRING_SCALE_OUT = { damping: 12, stiffness: 150 } as const;
const SPRING_ROTATION_IN = { damping: 15, stiffness: 80 } as const;
const SPRING_ROTATION_GRAB = { damping: 20 } as const;
const SPRING_SCALE_GRAB = { damping: 15, stiffness: 200 } as const;

const TIMING_OPACITY_IN = { duration: 300, easing: Easing.out(Easing.ease) } as const;
const TIMING_OPACITY_OUT = { duration: 250, easing: Easing.in(Easing.ease) } as const;

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.max(min, Math.min(max, value));
}

function getHiddenTranslateX(size: number) {
  return -size - HIDDEN_OFFSET_X;
}

function getHiddenTranslateY(height: number) {
  return height;
}

function getFinalTranslateY(height: number, size: number, bottomOffset: number) {
  return height - size - bottomOffset;
}

export function FloatingDraggableButton({
  onPress,
  size = DEFAULT_SIZE,
  disabled = false,
  ariaLabel,
  isLoading = false,
  visible = true,
  badgeCount = 0,
  offset = DEFAULT_OFFSET,
  variant = 'default',
  forceShowTrigger = 0,
  children,
  style,
  testID,
  edgePadding = DEFAULT_EDGE_PADDING,
  backgroundColor,
}: FloatingDraggableButtonProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const isDanger = variant === 'danger';

  const onPressRef = useRef(onPress);
  useEffect(() => {
    onPressRef.current = onPress;
  }, [onPress]);

  const fallbackBgColor = useMemo(() => {
    if (backgroundColor) return backgroundColor;
    if (isDanger) return 'rgba(239, 68, 68, 0.9)';
    return theme.scheme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)';
  }, [backgroundColor, isDanger, theme.scheme]);

  const translateX = useSharedValue(getHiddenTranslateX(size));
  const translateY = useSharedValue(getHiddenTranslateY(height));
  const scale = useSharedValue(ENTER_SCALE_FROM);
  const rotation = useSharedValue(ENTER_ROTATION_FROM_DEG);
  const opacity = useSharedValue(1);
  const borderPulse = useSharedValue(0);
  const startPos = useRef({ x: 0, y: 0 });
  const isAnimatingOut = useRef(false);

  const animateToHidden = useCallback(
    (options?: { onFinish?: () => void }) => {
      // Animate back to starting position (reverse of entrance)
      translateX.value = withSpring(getHiddenTranslateX(size), SPRING_POSITION);
      translateY.value = withSpring(getHiddenTranslateY(height), SPRING_POSITION);
      scale.value = withSpring(ENTER_SCALE_FROM, SPRING_SCALE_IN);
      rotation.value = withSpring(ENTER_ROTATION_FROM_DEG, SPRING_ROTATION_IN);

      const finish = options?.onFinish;
      if (!finish) {
        opacity.value = withTiming(HIDDEN_OPACITY, TIMING_OPACITY_OUT);
        return;
      }

      opacity.value = withTiming(
        HIDDEN_OPACITY as unknown as number,
        TIMING_OPACITY_OUT,
        (finished?: boolean) => {
          if (finished) runOnJS(finish)();
        }
      );
    },
    [height, opacity, rotation, scale, size, translateX, translateY]
  );

  const animateOut = useCallback(() => {
    if (isAnimatingOut.current) return;
    isAnimatingOut.current = true;

    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // noop
    }

    animateToHidden({
      onFinish: () => {
        onPressRef.current?.();
      },
    });
  }, [animateToHidden]);

  useEffect(() => {
    if (isLoading) {
      borderPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: PULSE_DURATION_MS, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: PULSE_DURATION_MS, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      borderPulse.value = withTiming(0, { duration: 200 });
    }
  }, [borderPulse, isLoading]);

  const animateIn = useCallback(() => {
    isAnimatingOut.current = false;
    translateX.value = withSpring(offset.left ?? DEFAULT_OFFSET.left, SPRING_POSITION);
    const finalY = getFinalTranslateY(height, size, offset.bottom ?? DEFAULT_OFFSET.bottom);
    translateY.value = withSpring(finalY, SPRING_POSITION);
    scale.value = withSequence(
      withSpring(1.2, SPRING_SCALE_IN),
      withSpring(1, SPRING_SCALE_OUT)
    );
    rotation.value = withSpring(0, SPRING_ROTATION_IN);
    opacity.value = withTiming(1, TIMING_OPACITY_IN);
  }, [height, offset.bottom, offset.left, opacity, rotation, scale, size, translateX, translateY]);

  // Initial animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (visible) {
        animateIn();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (visible && isAnimatingOut.current) {
      animateIn();
    } else if (!visible && !isAnimatingOut.current) {
      animateToHidden();
      isAnimatingOut.current = true;
    }
  }, [visible, animateIn, animateToHidden]);

  useEffect(() => {
    if (forceShowTrigger > 0 && visible) {
      isAnimatingOut.current = false;
      animateIn();
    }
  }, [forceShowTrigger, visible, animateIn]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startPos.current = {
          x: translateX.value,
          y: translateY.value,
        };
        scale.value = withSpring(1.1, SPRING_SCALE_GRAB);
        rotation.value = withSpring(0, SPRING_ROTATION_GRAB);
      },
      onPanResponderMove: (_: GestureResponderEvent, gesture) => {
        const newX = startPos.current.x + gesture.dx;
        const newY = startPos.current.y + gesture.dy;
        translateX.value = clamp(newX, edgePadding, width - size - edgePadding);
        translateY.value = clamp(newY, edgePadding, height - size - edgePadding);
      },
      onPanResponderRelease: (_evt, gesture) => {
        scale.value = withSpring(1, SPRING_SCALE_GRAB);
        const distance = Math.sqrt(gesture.dx ** 2 + gesture.dy ** 2);
        if (distance < 5 && !disabled) {
          animateOut();
        }
      },
    })
  ).current;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const borderAnimatedStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      borderPulse.value,
      [0, 1],
      isDanger
        ? ['rgba(239,68,68,0.4)', 'rgba(239,68,68,1)']
        : theme.scheme === 'dark'
          ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.9)']
          : ['rgba(55,0,179,0.2)', 'rgba(55,0,179,0.9)']
    );
    return {
      borderWidth: isLoading ? 2 : 0,
      borderColor,
      borderRadius: size / 2,
    };
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      testID={testID}
      style={[styles.floatingButton, { width: size, height: size, borderRadius: size / 2 }, style, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={ariaLabel}
    >
      <Animated.View style={[{ width: size, height: size, borderRadius: size / 2 }, borderAnimatedStyle]}>
        <LiquidGlassView
          style={[{ flex: 1, borderRadius: size / 2 }, !isLiquidGlassSupported && { backgroundColor: fallbackBgColor }]}
          interactive
          effect="clear"
        >
          <Pressable
            onPress={() => {
              if (!disabled) animateOut();
            }}
            style={styles.buttonInner}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.3)', borderless: true }}
          >
            {children ?? <View />}
          </Pressable>
        </LiquidGlassView>
      </Animated.View>

      {badgeCount > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.colors.danger }]}>
          <Text style={[styles.badgeText, { color: theme.colors.onDanger }]}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});


