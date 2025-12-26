import * as React from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme';
import { Card } from '../primitives/Card';

export type PreviewHeroCardProps = {
  aspectRatio?: number;
  overlayTopLeft?: React.ReactNode;
  background?: React.ReactNode;
  image?: React.ReactNode;
  overlayBottom?: React.ReactNode;
  style?: ViewStyle;
};

export function PreviewHeroCard({
  aspectRatio = 4 / 3,
  overlayTopLeft,
  background,
  image,
  overlayBottom,
  style,
}: PreviewHeroCardProps) {
  const theme = useTheme();
  const radius = 16;

  return (
    <Card
      variant="surfaceRaised"
      padded={false}
      border={false}
      style={[
        {
          width: '100%',
          aspectRatio,
          borderRadius: radius,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View style={{ flex: 1 }}>
        {background ? <View style={{ position: 'absolute', inset: 0 }}>{background}</View> : null}
        {image ? <View style={{ position: 'absolute', inset: 0 }}>{image}</View> : null}

        {overlayTopLeft ? (
          <View style={{ position: 'absolute', top: theme.spacing.sm, left: theme.spacing.sm, zIndex: 2 }}>
            {overlayTopLeft}
          </View>
        ) : null}

        {overlayBottom ? <View style={{ flex: 1, justifyContent: 'flex-end' }}>{overlayBottom}</View> : null}
      </View>
    </Card>
  );
}


