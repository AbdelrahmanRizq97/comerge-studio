import * as React from 'react';
import { View } from 'react-native';

import type { AgentRunProgressView } from '../../studio/hooks/useAgentRunProgress';
import { useTheme } from '../../theme';
import { Text } from '../primitives/Text';
import { withAlpha } from '../utils/color';

export type AgentProgressCardProps = {
  progress: AgentRunProgressView;
};

function titleForPhase(phase: AgentRunProgressView['phase']): string {
  if (phase === 'planning') return 'Planning';
  if (phase === 'reasoning') return 'Reasoning';
  if (phase === 'analyzing') return 'Analyzing';
  if (phase === 'editing') return 'Editing';
  if (phase === 'executing') return 'Executing';
  if (phase === 'validating') return 'Validating';
  if (phase === 'finalizing') return 'Finalizing';
  if (phase === 'working') return 'Working';
  return 'Working';
}

function titleForStatus(status: AgentRunProgressView['status']): string {
  if (status === 'succeeded') return 'Completed';
  if (status === 'failed') return 'Failed';
  if (status === 'cancelled') return 'Cancelled';
  return 'In Progress';
}

export function AgentProgressCard({ progress }: AgentProgressCardProps) {
  const theme = useTheme();
  const statusLabel = titleForStatus(progress.status);
  const phaseLabel = titleForPhase(progress.phase);
  const subtitle = progress.latestMessage || `Agent is ${phaseLabel.toLowerCase()}...`;
  const todo = progress.todoSummary;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.lg,
        marginHorizontal: theme.spacing.md,
        padding: theme.spacing.md,
        backgroundColor: withAlpha(theme.colors.surface, theme.scheme === 'dark' ? 0.84 : 0.94),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text variant="caption">{statusLabel}</Text>
        <Text variant="captionMuted">{phaseLabel}</Text>
      </View>

      <Text variant="bodyMuted">{subtitle}</Text>

      {progress.changedFilesCount > 0 ? (
        <Text variant="captionMuted" style={{ marginTop: 8 }}>
          Updated files: {progress.changedFilesCount}
        </Text>
      ) : null}

      {progress.recentFiles.length > 0 ? (
        <View style={{ marginTop: 6 }}>
          {progress.recentFiles.map((path) => (
            <Text key={path} variant="captionMuted" numberOfLines={1}>
              • {path}
            </Text>
          ))}
        </View>
      ) : null}

      {todo ? (
        <Text variant="captionMuted" style={{ marginTop: 8 }}>
          Todos: {todo.completed}/{todo.total} complete
          {todo.currentTask ? ` • ${todo.currentTask}` : ''}
        </Text>
      ) : null}
    </View>
  );
}

