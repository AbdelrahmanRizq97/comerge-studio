import * as React from 'react';
import { Pressable, View } from 'react-native';

export function ReviewMergeRequestActionButton({
  accessibilityLabel,
  backgroundColor,
  disabled,
  onPress,
  children,
  iconOnly,
}: {
  accessibilityLabel: string;
  backgroundColor: string;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
  iconOnly: boolean;
}) {
  const [pressed, setPressed] = React.useState(false);
  const height = iconOnly ? 36 : 40;
  const width = iconOnly ? 36 : undefined;
  const paddingHorizontal = iconOnly ? 0 : 16;
  const paddingVertical = iconOnly ? 0 : 8;
  const opacity = disabled ? 0.5 : pressed ? 0.9 : 1;

  return (
    <View
      style={{
        width,
        minWidth: width,
        height,
        minHeight: height,
        borderRadius: 999,
        backgroundColor,
        opacity,
        paddingHorizontal,
        paddingVertical,
        justifyContent: 'center',
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={Boolean(disabled)}
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={{
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        hitSlop={8}
      >
        {children}
      </Pressable>
    </View>
  );
}


