import * as React from 'react';
import { TextInput, type TextInputProps, type TextStyle } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

import { useTheme } from '../../theme';

export type MultilineTextInputProps = Omit<TextInputProps, 'style'> & {
  useBottomSheetTextInput?: boolean;
  style?: TextStyle;
};

export const MultilineTextInput = React.forwardRef<TextInput, MultilineTextInputProps>(function MultilineTextInput(
  { useBottomSheetTextInput = false, placeholder, placeholderTextColor, style, ...props }: MultilineTextInputProps,
  ref
) {
  const theme = useTheme();

  const baseStyle: TextStyle = {
    minHeight: 44,
    maxHeight: 160,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
  };

  const resolvedPlaceholderColor = placeholderTextColor ?? theme.colors.textSubtle;

  const commonProps: TextInputProps = {
    ...props,
    multiline: true,
    placeholder,
    placeholderTextColor: resolvedPlaceholderColor,
    style: [baseStyle, style],
    textAlignVertical: 'top',
  };

  return useBottomSheetTextInput ? (
    <BottomSheetTextInput ref={ref} {...commonProps} />
  ) : (
    <TextInput ref={ref} {...commonProps} />
  );
});


