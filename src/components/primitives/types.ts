import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

export type WithStyle<T> = {
  style?: StyleProp<T>;
};

export type PressStateStyle<T> = {
  style?: StyleProp<T> | ((state: { pressed: boolean; disabled?: boolean }) => StyleProp<T>);
};

export type TextAlign = 'auto' | 'left' | 'right' | 'center' | 'justify';

export type TextVariant = 'body' | 'bodyMuted' | 'caption' | 'captionMuted' | 'title';

export type ButtonVariant = 'primary' | 'neutral' | 'danger' | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'icon';

export type SurfaceVariant = 'background' | 'surface' | 'surfaceRaised' | 'floating';

export type CardVariant = 'surface' | 'surfaceRaised';

export type DividerVariant = 'subtle' | 'default';

export type IconColorRole = 'default' | 'muted' | 'primary' | 'danger' | 'success' | 'warning';

export type TextStyleProp = StyleProp<TextStyle>;
export type ViewStyleProp = StyleProp<ViewStyle>;


