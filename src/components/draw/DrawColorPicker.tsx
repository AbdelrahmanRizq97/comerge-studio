import * as React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme';

export type DrawColorPickerProps = {
  colors: string[];
  selected: string;
  expanded: boolean;
  onToggle: () => void;
  onSelect: (color: string) => void;
  style?: ViewStyle;
};

export function DrawColorPicker({
  colors,
  selected,
  expanded,
  onToggle,
  onSelect,
  style,
}: DrawColorPickerProps) {
  useTheme();

  const isWhite = (c: string) => c.toUpperCase() === '#FFFFFF';

  const swatchStyle = (c: string, isSelected: boolean): ViewStyle => {
    const base: ViewStyle = {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c,
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    };

    const selectedStyle: ViewStyle = isSelected
      ? {
          borderColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
          elevation: 4,
        }
      : {};

    const whiteStyle: ViewStyle = isWhite(c) ? { borderColor: 'rgba(0, 0, 0, 0.2)' } : {};

    return { ...base, ...selectedStyle, ...whiteStyle };
  };

  if (!expanded) {
    return (
      <Pressable onPress={onToggle} style={[swatchStyle(selected, true), style]} />
    );
  }

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}>
      {colors.map((c, idx) => (
        <Pressable
          key={`${c}-${idx}`}
          onPress={() => {
            onSelect(c);
            onToggle();
          }}
          style={swatchStyle(c, selected === c)}
        />
      ))}
    </View>
  );
}


