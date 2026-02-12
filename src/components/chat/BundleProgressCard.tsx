import * as React from 'react';
import { View } from 'react-native';

import type { AgentBundleProgressView } from '../../studio/hooks/useAgentRunProgress';
import { useTheme } from '../../theme';
import { Text } from '../primitives/Text';
import { withAlpha } from '../utils/color';

export type BundleProgressCardProps = {
  progress: AgentBundleProgressView;
};

function titleForStatus(status: AgentBundleProgressView['status']): string {
  if (status === 'succeeded') return 'Completed';
  if (status === 'failed') return 'Failed';
  return 'In Progress';
}

export function BundleProgressCard({ progress }: BundleProgressCardProps) {
  const theme = useTheme();
  const statusLabel = titleForStatus(progress.status);
  const percent = Math.round(Math.max(0, Math.min(1, progress.progressValue)) * 100);
  const fillColor =
    progress.status === 'failed'
      ? theme.colors.danger
      : progress.status === 'succeeded'
        ? theme.colors.success
        : theme.colors.warning;
  const detail = progress.errorMessage || progress.phaseLabel;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Bundle progress ${statusLabel}`}
      accessibilityValue={{ min: 0, max: 100, now: percent, text: `${percent}%` }}
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.lg,
        marginHorizontal: theme.spacing.md,
        padding: theme.spacing.md,
        backgroundColor: withAlpha(theme.colors.surface, theme.scheme === 'dark' ? 0.84 : 0.94),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text variant="caption">{statusLabel}</Text>
        <Text variant="captionMuted">{percent}%</Text>
      </View>

      <View
        style={{
          width: '100%',
          height: 8,
          borderRadius: 999,
          backgroundColor: withAlpha(theme.colors.border, theme.scheme === 'dark' ? 0.5 : 0.6),
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${percent}%`,
            height: '100%',
            backgroundColor: fillColor,
          }}
        />
      </View>

      <Text variant="captionMuted" numberOfLines={1} style={{ marginTop: 8, minHeight: 16 }}>
        {detail}
      </Text>
    </View>
  );
}

