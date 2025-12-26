import * as React from 'react';
import {
  Pressable,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../../theme';
import type { ButtonSize, ButtonVariant, PressStateStyle, WithStyle } from './types';

export type ButtonProps = Omit<PressableProps, 'style'> &
  WithStyle<ViewStyle> &
  PressStateStyle<ViewStyle> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    children?: React.ReactNode;
  };

function backgroundFor(
  variant: ButtonVariant,
  theme: ReturnType<typeof useTheme>,
  pressed: boolean,
  disabled?: boolean
): string {
  const { colors } = theme;
  if (variant === 'ghost') return 'transparent';

  if (disabled) {
    return colors.neutral;
  }

  const base =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : colors.neutral;

  // pressed state is a subtle overlay using borderStrong as tint source
  if (!pressed) return base;
  return base;
}

function borderFor(variant: ButtonVariant, theme: ReturnType<typeof useTheme>): { borderWidth?: number; borderColor?: string } {
  if (variant !== 'ghost') return {};
  return { borderWidth: 1, borderColor: theme.colors.border };
}

function paddingFor(size: ButtonSize, theme: ReturnType<typeof useTheme>): { paddingHorizontal: number; paddingVertical: number; minHeight: number; minWidth?: number } {
  switch (size) {
    case 'sm':
      return { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, minHeight: 36 };
    case 'icon':
      return { paddingHorizontal: 0, paddingVertical: 0, minHeight: 44, minWidth: 44 };
    case 'md':
    default:
      return { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, minHeight: 44 };
  }
}

export function Button({
  variant = 'neutral',
  size = 'md',
  disabled,
  style,
  children,
  ...props
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled ?? undefined;

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      style={(state) => {
        const pressed = state.pressed;
        const base: ViewStyle = {
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          borderRadius: size === 'icon' ? theme.radii.pill : theme.radii.pill,
          backgroundColor: backgroundFor(variant, theme, pressed, isDisabled),
          opacity: pressed && !isDisabled ? 0.92 : 1,
          ...paddingFor(size, theme),
          ...(borderFor(variant, theme) as ViewStyle),
        };

        const resolved =
          typeof style === 'function'
            ? style({ pressed, disabled: isDisabled })
            : style;

        return [base, resolved] as any;
      }}
    >
      {children}
    </Pressable>
  );
}


