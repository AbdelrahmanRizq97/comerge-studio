import * as React from 'react';
import { View, type ViewStyle } from 'react-native';
import { CheckCheck, GitMerge } from 'lucide-react-native';

import type { ChatMessage } from '../models/types';
import { useTheme } from '../../theme';
import { MarkdownText } from '../primitives/MarkdownText';
import { Surface } from '../primitives/Surface';

export type ChatMessageBubbleProps = {
  message: ChatMessage;
  /**
   * Optional custom renderer for message content (e.g. markdown).
   */
  renderContent?: (message: ChatMessage) => React.ReactNode;
  style?: ViewStyle;
};

export function ChatMessageBubble({ message, renderContent, style }: ChatMessageBubbleProps) {
  const theme = useTheme();
  const metaEvent = message.meta?.event ?? null;
  const metaStatus = message.meta?.status ?? null;

  const isMergeApproved = metaEvent === 'merge_request.approved';
  const isMergeRejected = metaEvent === 'merge_request.rejected';
  const isMergeCompleted = metaEvent === 'merge.completed';

  const isHuman = message.author === 'human' || isMergeApproved || isMergeRejected;

  const align: ViewStyle = { alignSelf: isHuman ? 'flex-end' : 'flex-start' };
  const bubbleVariant = isHuman ? 'surface' : 'surfaceRaised';
  const cornerStyle: ViewStyle = isHuman ? { borderTopRightRadius: 0 } : { borderTopLeftRadius: 0 };

  const bodyColor =
    metaStatus === 'success' ? theme.colors.success : metaStatus === 'error' ? theme.colors.danger : undefined;

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
          {isMergeCompleted ? (
            <CheckCheck size={16} color={theme.colors.success} style={{ marginRight: theme.spacing.sm }} />
          ) : null}
          {isMergeApproved ? (
            <GitMerge size={16} color={theme.colors.text} style={{ marginRight: theme.spacing.sm }} />
          ) : null}
          <View style={{ flexShrink: 1, minWidth: 0 }}>
            {renderContent ? renderContent(message) : <MarkdownText markdown={message.content} variant="chat" bodyColor={bodyColor} />}
          </View>
        </View>
      </Surface>
    </View>
  );
}


