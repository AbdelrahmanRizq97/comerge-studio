import * as React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { Card } from '../../../components/primitives/Card';

export type PressableCardRowProps = {
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
  left: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  style?: ViewStyle;
};

export function PressableCardRow({
  accessibilityLabel,
  onPress,
  disabled,
  left,
  title,
  subtitle,
  right,
  style,
}: PressableCardRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: disabled ? 0.6 : pressed ? 0.85 : 1 })}
    >
      <Card padded={false} border={false} style={style}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {left}
          <View style={{ flex: 1, minWidth: 0 }}>
            {title}
            {subtitle ? subtitle : null}
          </View>
          {right ? <View style={{ marginLeft: 16 }}>{right}</View> : null}
        </View>
      </Card>
    </Pressable>
  );
}


