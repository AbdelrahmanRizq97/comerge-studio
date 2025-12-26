import * as React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme } from '../../theme';
import type { TextAlign, TextVariant, WithStyle } from './types';

export type TextProps = RNTextProps &
  WithStyle<TextStyle> & {
    variant?: TextVariant;
    align?: TextAlign;
    /**
     * Optional explicit color override. Prefer `variant` + theme.
     * Use sparingly for semantic emphasis.
     */
    color?: string;
  };

function getVariantStyle(variant: TextVariant, theme: ReturnType<typeof useTheme>): TextStyle {
  const { colors, typography } = theme;
  switch (variant) {
    case 'title':
      return {
        color: colors.text,
        fontSize: typography.fontSize.xl,
        lineHeight: typography.lineHeight.xl,
        fontWeight: typography.fontWeight.semibold,
      };
    case 'caption':
      return {
        color: colors.text,
        fontSize: typography.fontSize.xs,
        lineHeight: typography.lineHeight.xs,
        fontWeight: typography.fontWeight.medium,
      };
    case 'captionMuted':
      return {
        color: colors.textSubtle,
        fontSize: typography.fontSize.xs,
        lineHeight: typography.lineHeight.xs,
        fontWeight: typography.fontWeight.medium,
      };
    case 'bodyMuted':
      return {
        color: colors.textMuted,
        fontSize: typography.fontSize.md,
        lineHeight: typography.lineHeight.md,
        fontWeight: typography.fontWeight.regular,
      };
    case 'body':
    default:
      return {
        color: colors.text,
        fontSize: typography.fontSize.md,
        lineHeight: typography.lineHeight.md,
        fontWeight: typography.fontWeight.regular,
      };
  }
}

export function Text({
  variant = 'body',
  align,
  color,
  style,
  ...props
}: TextProps) {
  const theme = useTheme();
  const base = getVariantStyle(variant, theme);

  return (
    <RNText
      {...props}
      style={[
        base,
        align ? { textAlign: align } : null,
        color ? { color } : null,
        style,
      ]}
    />
  );
}


