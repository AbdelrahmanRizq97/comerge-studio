import * as React from 'react';
import { View } from 'react-native';

import type { App } from '../../../data/apps/types';
import { PreviewMetaRow } from '../../../components/preview/PreviewMetaRow';
import { Text } from '../../../components/primitives/Text';
import { IconPlay } from '../../../components/icons/StudioIcons';
import { withAlpha } from '../../../components/utils/color';
import { useTheme } from '../../../theme';
import { formatCount } from './utils';

export type PreviewMetaSectionProps = {
  app: App;
  isOwner: boolean;
  creator: { name: string | null; avatar: string | null } | null;
  downloadsCount?: number;
};

export function PreviewMetaSection({ app, isOwner, creator, downloadsCount }: PreviewMetaSectionProps) {
  const theme = useTheme();

  return (
    <PreviewMetaRow
      title={app.name}
      subtitle={app.description}
      avatarUri={creator?.avatar ?? null}
      creatorName={creator?.name ?? null}
      tag={
        isOwner || app.forkedFromAppId ? (
          <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: '#3700B3' }}>
            <Text variant="caption" style={{ color: '#fff', fontWeight: theme.typography.fontWeight.semibold }}>
              {app.forkedFromAppId ? 'Remix' : 'Owner'}
            </Text>
          </View>
        ) : null
      }
      rightMetric={
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 6,
            backgroundColor: withAlpha(theme.colors.neutral, 0.3),
          }}
        >
          <Text
            style={{
              marginRight: 2,
              color: theme.colors.textMuted,
              fontSize: 14,
              lineHeight: 18,
              fontWeight: theme.typography.fontWeight.bold,
            }}
          >
            {formatCount(downloadsCount ?? app.insights?.totalDownloads ?? 0)}
          </Text>
          <IconPlay size={14} colorToken="textMuted" fill={theme.colors.textMuted} />
        </View>
      }
      style={{ marginBottom: 16 }}
    />
  );
}


