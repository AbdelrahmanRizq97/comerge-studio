import * as React from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme';
import { Avatar } from '../primitives/Avatar';
import { Text } from '../primitives/Text';

export type PreviewMetaRowProps = {
  avatarUri?: string | null;
  creatorName?: string | null;
  title: string;
  subtitle?: string | null;
  tag?: React.ReactNode;
  rightMetric?: React.ReactNode;
  style?: ViewStyle;
};

export function PreviewMetaRow({
  avatarUri,
  creatorName,
  title,
  subtitle,
  tag,
  rightMetric,
  style,
}: PreviewMetaRowProps) {
  const theme = useTheme();

  return (
    <View style={[{ alignSelf: 'stretch' }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar uri={avatarUri} name={creatorName} size={24} style={{ marginRight: theme.spacing.sm }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, marginRight: theme.spacing.sm }}>
          <Text
            numberOfLines={1}
            style={{
              flexShrink: 1,
              color: theme.colors.text,
              fontSize: 16,
              lineHeight: 20,
              fontWeight: theme.typography.fontWeight.semibold,
            }}
          >
            {title}
          </Text>
          {tag ? <View style={{ marginLeft: theme.spacing.sm }}>{tag}</View> : null}
        </View>

        {rightMetric ? <View>{rightMetric}</View> : null}
      </View>

      {subtitle ? (
        <Text
          numberOfLines={2}
          style={{
            marginTop: theme.spacing.sm,
            color: theme.colors.textMuted,
            fontSize: 14,
            lineHeight: 18,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}


