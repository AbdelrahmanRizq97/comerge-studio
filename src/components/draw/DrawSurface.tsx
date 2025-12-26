import * as React from 'react';
import { PanResponder, StyleSheet, View, type GestureResponderEvent, type PanResponderGestureState, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { Point, Stroke } from './types';
import { pointsToSmoothPath } from './strokes';

export type DrawSurfaceProps = {
  color: string;
  strokeWidth: number;
  strokes: Stroke[];
  onAddStroke: (stroke: Stroke) => void;
  style?: ViewStyle;
  minDistance?: number;
};

export function DrawSurface({
  color,
  strokeWidth,
  strokes,
  onAddStroke,
  style,
  minDistance = 1,
}: DrawSurfaceProps) {
  const [renderTick, setRenderTick] = React.useState(0);
  const currentPointsRef = React.useRef<Point[]>([]);
  const rafRef = React.useRef<number | null>(null);

  const triggerRender = React.useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setRenderTick((n) => n + 1);
    });
  }, []);

  React.useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  const onStart = React.useCallback((e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    currentPointsRef.current = [{ x: locationX, y: locationY }];
    triggerRender();
  }, [triggerRender]);

  const onMove = React.useCallback((e: GestureResponderEvent, _g: PanResponderGestureState) => {
    const { locationX, locationY } = e.nativeEvent;
    const pts = currentPointsRef.current;
    if (pts.length > 0) {
      const last = pts[pts.length - 1];
      const dx = locationX - last.x;
      const dy = locationY - last.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) return;
    }
    currentPointsRef.current = [...pts, { x: locationX, y: locationY }];
    triggerRender();
  }, [minDistance, triggerRender]);

  const onEnd = React.useCallback(() => {
    const points = currentPointsRef.current;
    if (points.length > 0) {
      onAddStroke({ points, color, width: strokeWidth });
    }
    currentPointsRef.current = [];
    triggerRender();
  }, [color, onAddStroke, strokeWidth, triggerRender]);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: onStart,
        onPanResponderMove: onMove,
        onPanResponderRelease: onEnd,
        onPanResponderTerminate: onEnd,
      }),
    [onEnd, onMove, onStart]
  );

  const currentPath = pointsToSmoothPath(currentPointsRef.current);

  // renderTick is used to force re-render when refs change
  void renderTick;

  return (
    <View style={[StyleSheet.absoluteFill, styles.container, style]} {...panResponder.panHandlers}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        {strokes.map((s, idx) => {
          const d = pointsToSmoothPath(s.points);
          if (!d) return null;
          return (
            <Path
              key={idx}
              d={d}
              stroke={s.color}
              strokeWidth={s.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          );
        })}
        {currentPath ? (
          <Path
            d={currentPath}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 5,
  },
});


