import * as React from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme';
import { Card } from '../primitives/Card';
import { Text } from '../primitives/Text';

export type ForkNoticeBannerProps = {
  isOwner?: boolean;
  title?: string;
  description?: string | null;
  style?: ViewStyle;
};

export function ForkNoticeBanner({ isOwner = true, title, description, style }: ForkNoticeBannerProps) {
  const theme = useTheme();
  const resolvedTitle = title ?? (isOwner ? 'Remixed app' : 'Remix app');
  const resolvedDescription =
    description ??
    (isOwner
      ? 'Any changes you make will be a remix of the original app. You can view the edited version in the Remix tab in your apps page.'
      : 'Once you make edits, this remixed version will appear on your Remixed apps page.');

  return (
    <Card
      variant="surfaceRaised"
      padded={false}
      border
      style={[
        {
          width: '100%',
          paddingHorizontal: theme.spacing.lg,
          paddingTop: 14,
          paddingBottom: 8,
        },
        style,
      ]}
    >
      <View style={{ minWidth: 0 }}>
        <Text
          style={{
            color: '#22C55E', // green-500
            fontSize: 14,
            lineHeight: 18,
            fontWeight: theme.typography.fontWeight.medium,
            marginBottom: 4,
          }}
        >
          {resolvedTitle}
        </Text>
        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: 14,
            lineHeight: 20,
            paddingBottom: 6,
          }}
        >
          {resolvedDescription}
        </Text>
      </View>
    </Card>
  );
}


