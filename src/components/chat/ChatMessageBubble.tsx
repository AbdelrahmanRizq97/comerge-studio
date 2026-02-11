import * as React from 'react';
import { View, type ViewStyle } from 'react-native';
import { CheckCheck, GitMerge, RotateCcw } from 'lucide-react-native';

import type { ChatMessage } from '../models/types';
import { useTheme } from '../../theme';
import { Button } from '../primitives/Button';
import { MarkdownText } from '../primitives/MarkdownText';
import { Surface } from '../primitives/Surface';
import { Text } from '../primitives/Text';

export type ChatMessageBubbleProps = {
  message: ChatMessage;
  /**
   * Optional custom renderer for message content (e.g. markdown).
   */
  renderContent?: (message: ChatMessage) => React.ReactNode;
  isLast?: boolean;
  retrying?: boolean;
  onRetry?: () => void;
  style?: ViewStyle;
};

export function ChatMessageBubble({ message, renderContent, isLast, retrying, onRetry, style }: ChatMessageBubbleProps) {
  const theme = useTheme();
  const metaEvent = message.meta?.event ?? null;
  const metaStatus = message.meta?.status ?? null;

  const isMergeApproved = metaEvent === 'merge_request.approved';
  const isMergeRejected = metaEvent === 'merge_request.rejected';
  const isMergeCompleted = metaEvent === 'merge.completed';

  const isSyncStarted = metaEvent === 'sync.started';
  const isSyncCompleted = metaEvent === 'sync.completed';

  const isHuman = message.author === 'human' || isMergeApproved || isMergeRejected;

  const align: ViewStyle = { alignSelf: isHuman ? 'flex-end' : 'flex-start' };
  const bubbleVariant = isHuman ? 'surface' : 'surfaceRaised';
  const cornerStyle: ViewStyle = isHuman ? { borderTopRightRadius: 0 } : { borderTopLeftRadius: 0 };

  const bodyColor =
    metaStatus === 'success' ? theme.colors.success : metaStatus === 'error' ? theme.colors.danger : undefined;
  const showRetry = Boolean(onRetry) && isLast && metaStatus === 'error';
  const retryLabel = retrying ? 'Retrying...' : 'Retry';

  return (
    <View style={[align, style]}>
      <Surface
        variant={bubbleVariant}
        style={[
          {
            maxWidth: '85%',
            borderRadius: theme.radii.lg,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
          },
          cornerStyle,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isMergeCompleted || isSyncCompleted ? (
            <CheckCheck size={16} color={theme.colors.success} style={{ marginRight: theme.spacing.sm }} />
          ) : null}
          {isMergeApproved || isSyncStarted ? (
            <GitMerge size={16} color={theme.colors.text} style={{ marginRight: theme.spacing.sm }} />
          ) : null}
          <View style={{ flexShrink: 1, minWidth: 0 }}>
            {renderContent ? renderContent(message) : <MarkdownText markdown={message.content} variant="chat" bodyColor={bodyColor} />}
          </View>
        </View>
      </Surface>
      {showRetry ? (
        <View style={{ marginTop: theme.spacing.xs, alignSelf: align.alignSelf }}>
          <Button
            variant="ghost"
            size="sm"
            onPress={onRetry}
            disabled={retrying}
            style={{ borderColor: theme.colors.danger }}
            accessibilityLabel="Retry send"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {!retrying ? <RotateCcw size={14} color={theme.colors.danger} /> : null}
              <Text
                variant="caption"
                color={theme.colors.danger}
                style={{ marginLeft: retrying ? 0 : theme.spacing.xs }}
                numberOfLines={1}
              >
                {retryLabel}
              </Text>
            </View>
          </Button>
        </View>
      ) : null}
    </View>
  );
}


