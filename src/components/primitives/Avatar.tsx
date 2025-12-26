import * as React from 'react';
import { Image, View, type ImageStyle, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme';
import { Text } from './Text';
import type { WithStyle } from './types';

export type AvatarProps = WithStyle<ViewStyle> & {
  size?: number;
  uri?: string | null;
  name?: string | null;
  /**
   * Optional override for the fallback background.
   * Prefer leaving this undefined so it uses theme.
   */
  fallbackBackgroundColor?: string;
  imageStyle?: WithStyle<ImageStyle>['style'];
};

function initialsFrom(name?: string | null): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '?';
  return trimmed[0]?.toUpperCase?.() ?? '?';
}

export function Avatar({
  size = 32,
  uri,
  name,
  fallbackBackgroundColor,
  style,
  imageStyle,
}: AvatarProps) {
  const theme = useTheme();
  const radius = size / 2;
  const fallbackBg = fallbackBackgroundColor ?? theme.colors.neutral;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          overflow: 'hidden',
          backgroundColor: fallbackBg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[{ width: size, height: size }, imageStyle]}
          resizeMode="cover"
        />
      ) : (
        <Text variant="caption" style={{ color: theme.colors.onNeutral }}>
          {initialsFrom(name)}
        </Text>
      )}
    </View>
  );
}


