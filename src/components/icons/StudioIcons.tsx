import * as React from 'react';
import type { LucideProps } from 'lucide-react-native';
import {
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  MessageSquare,
  Pencil,
  Play,
  Send,
  X,
  Check,
} from 'lucide-react-native';

import { useTheme } from '../../theme';

export type StudioIconProps = Omit<LucideProps, 'color'> & {
  colorToken?: 'floatingContent' | 'text' | 'textMuted' | 'primary' | 'danger' | 'onPrimary' | 'onDanger';
};

function useResolvedIconColor(token: NonNullable<StudioIconProps['colorToken']>) {
  const theme = useTheme();
  switch (token) {
    case 'text':
      return theme.colors.text;
    case 'textMuted':
      return theme.colors.textMuted;
    case 'primary':
      return theme.colors.primary;
    case 'danger':
      return theme.colors.danger;
    case 'onPrimary':
      return theme.colors.onPrimary;
    case 'onDanger':
      return theme.colors.onDanger;
    case 'floatingContent':
    default:
      return theme.colors.floatingContent;
  }
}

function makeIcon(Comp: React.ComponentType<LucideProps>) {
  return function StudioIcon({ size = 20, strokeWidth = 2, colorToken = 'floatingContent', ...rest }: StudioIconProps) {
    const color = useResolvedIconColor(colorToken);
    return <Comp size={size} strokeWidth={strokeWidth} color={color} {...rest} />;
  };
}

// Header / nav
export const IconHome = makeIcon(Home);
export const IconClose = makeIcon(X);
export const IconBack = makeIcon(ChevronLeft);
export const IconChevronRight = makeIcon(ChevronRight);
export const IconChevronDown = makeIcon(ChevronDown);

// Actions
export const IconChat = makeIcon(MessageSquare);
export const IconDraw = makeIcon(Pencil);
export const IconSend = makeIcon(Send);
export const IconPlay = makeIcon(Play);
export const IconArrowDown = makeIcon(ArrowDown);
export const IconApprove = makeIcon(Check);


