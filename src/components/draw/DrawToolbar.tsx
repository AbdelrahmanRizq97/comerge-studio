import * as React from 'react';
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  View,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, GripVertical, Undo2, X } from 'lucide-react-native';

import { impact } from './optionalHaptics';
import { DrawColorPicker } from './DrawColorPicker';

export type DrawToolbarProps = {
  colors: string[];
  selectedColor: string;
  onSelectColor: (color: string) => void;
  canUndo: boolean;
  onUndo: () => void;
  onCancel: () => void;
  onDone: () => void;
  capturing?: boolean;
  hidden?: boolean;
  renderUndoIcon?: () => React.ReactNode;
  renderCancelIcon?: () => React.ReactNode;
  renderDoneIcon?: () => React.ReactNode;
  renderDragHandle?: () => React.ReactNode;
  style?: ViewStyle;
};

export function DrawToolbar({
  colors,
  selectedColor,
  onSelectColor,
  canUndo,
  onUndo,
  onCancel,
  onDone,
  capturing = false,
  hidden = false,
  renderUndoIcon,
  renderCancelIcon,
  renderDoneIcon,
  renderDragHandle,
  style,
}: DrawToolbarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [expanded, setExpanded] = React.useState(false);

  const pos = React.useRef(new Animated.ValueXY({ x: screenWidth / 2 - 110, y: -140 })).current;
  const start = React.useRef({ x: 0, y: 0 });
  const currentPos = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    if (hidden) return;
    Animated.spring(pos.y, {
      toValue: insets.top + 60,
      useNativeDriver: true,
      damping: 12,
      stiffness: 120,
      mass: 0.8,
    }).start();
  }, [hidden, insets.top, pos.y]);

  React.useEffect(() => {
    const id = pos.addListener((v) => {
      currentPos.current = { x: v.x ?? 0, y: v.y ?? 0 };
    });
    return () => {
      pos.removeListener(id);
    };
  }, [pos]);

  const clamp = React.useCallback(
    (x: number, y: number) => {
      const minX = 10;
      const maxX = Math.max(10, screenWidth - 230);
      const minY = insets.top + 10;
      const maxY = Math.max(minY, screenHeight - 180);
      return { x: Math.max(minX, Math.min(maxX, x)), y: Math.max(minY, Math.min(maxY, y)) };
    },
    [insets.top, screenHeight, screenWidth]
  );

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
        onPanResponderGrant: () => {
          start.current = { ...currentPos.current };
        },
        onPanResponderMove: (_e, g) => {
          const next = clamp(start.current.x + g.dx, start.current.y + g.dy);
          pos.setValue(next);
        },
        onPanResponderRelease: () => {
          const next = clamp(currentPos.current.x, currentPos.current.y);
          Animated.spring(pos, { toValue: next, useNativeDriver: true }).start();
        },
      }),
    [clamp, pos]
  );

  if (hidden) return null;

  function CircleActionButton({
    accessibilityLabel,
    disabled,
    capturingDisabled,
    backgroundColor,
    onPress,
    children,
  }: {
    accessibilityLabel: string;
    disabled?: boolean;
    capturingDisabled?: boolean;
    backgroundColor: string;
    onPress: () => void;
    children: React.ReactNode;
  }) {
    const isDisabled = Boolean(disabled) || Boolean(capturingDisabled);
    const [pressed, setPressed] = React.useState(false);
    return (
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          disabled={isDisabled}
          onPress={onPress}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
          hitSlop={8}
        >
          {children}
        </Pressable>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          zIndex: 100,
          transform: [{ translateX: pos.x }, { translateY: pos.y }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
        style,
      ]}
      {...panResponder.panHandlers}
    >
      <View
        style={{
          backgroundColor: '#F43F5E',
          borderRadius: 16,
          padding: 12,
          minWidth: 220,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {renderDragHandle ? (
            renderDragHandle()
          ) : (
            <GripVertical size={20} color="rgba(255, 255, 255, 0.6)" />
          )}

          <DrawColorPicker
            colors={colors}
            selected={selectedColor}
            expanded={expanded}
            onToggle={() => {
              void impact('light');
              setExpanded((v) => !v);
            }}
            onSelect={(c) => {
              void impact('light');
              onSelectColor(c);
            }}
          />

          <View style={{ width: 1, height: 20, backgroundColor: 'rgba(255, 255, 255, 0.3)', marginHorizontal: 4 }} />

          <CircleActionButton
            accessibilityLabel="Undo"
            disabled={!canUndo}
            capturingDisabled={capturing}
            backgroundColor={!canUndo || capturing ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.25)'}
            onPress={() => {
              void impact('light');
              onUndo();
            }}
          >
            {renderUndoIcon ? renderUndoIcon() : <Undo2 size={16} color={canUndo ? '#FFFFFF' : 'rgba(255,255,255,0.4)'} />}
          </CircleActionButton>

          <CircleActionButton
            accessibilityLabel="Cancel"
            capturingDisabled={capturing}
            backgroundColor="rgba(255, 255, 255, 0.15)"
            onPress={() => {
              void impact('medium');
              onCancel();
            }}
          >
            {renderCancelIcon ? renderCancelIcon() : <X size={16} color="#FFFFFF" />}
          </CircleActionButton>

          <CircleActionButton
            accessibilityLabel="Done"
            capturingDisabled={capturing}
            backgroundColor="rgba(255, 255, 255, 0.35)"
            onPress={() => {
              void impact('medium');
              onDone();
            }}
          >
            {capturing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : renderDoneIcon ? (
              renderDoneIcon()
            ) : (
              <Check size={16} color="#FFFFFF" />
            )}
          </CircleActionButton>
        </View>
      </View>
    </Animated.View>
  );
}


