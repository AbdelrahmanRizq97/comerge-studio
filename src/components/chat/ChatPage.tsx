import * as React from 'react';
import { View, type ViewStyle } from 'react-native';

import type { ChatMessage } from '../models/types';
import { useTheme } from '../../theme';
import { ChatMessageList, type ChatMessageListProps, type ChatMessageListRef } from './ChatMessageList';
import { ChatComposer, type ChatComposerProps } from './ChatComposer';

export type ChatPageProps = {
  header?: React.ReactNode;
  messages: ChatMessage[];
  showTypingIndicator?: boolean;
  renderMessageContent?: ChatMessageListProps['renderMessageContent'];
  topBanner?: React.ReactNode;
  composer: Omit<ChatComposerProps, 'attachments'> & {
    attachments?: ChatComposerProps['attachments'];
  };
  /**
   * Optional overlay (e.g. ScrollToBottomButton).
   */
  overlay?: React.ReactNode;
  style?: ViewStyle;
  onNearBottomChange?: ChatMessageListProps['onNearBottomChange'];
  listRef?: React.RefObject<ChatMessageListRef | null>;
};

export function ChatPage({
  header,
  messages,
  showTypingIndicator,
  renderMessageContent,
  topBanner,
  composer,
  overlay,
  style,
  onNearBottomChange,
  listRef,
}: ChatPageProps) {
  const theme = useTheme();
  const [composerHeight, setComposerHeight] = React.useState(0);
  return (
    <View style={[{ flex: 1 }, style]}>
      {header ? <View>{header}</View> : null}
      {topBanner ? (
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm }}>
          {topBanner}
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <ChatMessageList
          ref={listRef}
          messages={messages}
          showTypingIndicator={showTypingIndicator}
          renderMessageContent={renderMessageContent}
          onNearBottomChange={onNearBottomChange}
          contentStyle={{ paddingBottom: theme.spacing.xl + composerHeight }}
        />
        {overlay}
      </View>
      <ChatComposer
        {...composer}
        attachments={composer.attachments ?? []}
        onLayout={({ height }) => setComposerHeight(height)}
      />
    </View>
  );
}


