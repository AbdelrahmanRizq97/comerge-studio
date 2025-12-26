import * as React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';

import { useTheme } from '../../theme';

export type StudioSheetHeaderIconButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
  intent?: 'neutral' | 'primary' | 'danger';
  appearance?: 'glass' | 'solid';
};

export function StudioSheetHeaderIconButton({
  onPress,
  disabled,
  children,
  style,
  accessibilityLabel,
  intent = 'neutral',
  appearance = 'solid',
}: StudioSheetHeaderIconButtonProps) {
  const theme = useTheme();
  const size = 44;
  const [pressed, setPressed] = React.useState(false);

  const solidBg =
    intent === 'danger'
      ? theme.colors.danger
      : intent === 'primary'
        ? theme.colors.primary
        : theme.colors.neutral;

  const glassFallbackBg = theme.scheme === 'dark' ? '#18181B' : '#F6F6F6';
  const glassInnerBg = intent === 'danger' ? theme.colors.danger : theme.colors.primary;

  const resolvedOpacity = disabled ? 0.6 : pressed ? 0.9 : 1;

  return (
    <View style={style}>
      {appearance === 'glass' ? (
        <LiquidGlassView
          style={[{ borderRadius: 100 }, !isLiquidGlassSupported && { backgroundColor: glassFallbackBg }]}
          interactive
          effect="clear"
        >
          <View
            style={{
              width: size,
              height: size,
              borderRadius: 100,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: glassInnerBg,
              opacity: resolvedOpacity,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel}
              disabled={disabled}
              onPress={onPress}
              onPressIn={() => {
                if (!disabled) setPressed(true);
              }}
              onPressOut={() => setPressed(false)}
              hitSlop={8}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' }}
            >
              {children}
            </Pressable>
          </View>
        </LiquidGlassView>
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: 100,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: solidBg,
            opacity: resolvedOpacity,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            disabled={disabled}
            onPress={onPress}
            onPressIn={() => {
              if (!disabled) setPressed(true);
            }}
            onPressOut={() => setPressed(false)}
            hitSlop={8}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' }}
          >
            {children}
          </Pressable>
        </View>
      )}
    </View>
  );
}


