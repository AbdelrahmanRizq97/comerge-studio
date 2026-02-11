import * as React from 'react';
import { Platform, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ChatMessage } from '../models/types';
import { useTheme } from '../../theme';
import { ChatMessageList, type ChatMessageListProps, type ChatMessageListRef } from './ChatMessageList';
import { ChatComposer, type ChatComposerProps } from './ChatComposer';

export type ChatPageProps = {
  header?: React.ReactNode;
  messages: ChatMessage[];
  showTypingIndicator?: boolean;
  renderMessageContent?: ChatMessageListProps['renderMessageContent'];
  onRetryMessage?: ChatMessageListProps['onRetryMessage'];
  isRetryingMessage?: ChatMessageListProps['isRetryingMessage'];
  topBanner?: React.ReactNode;
  composerTop?: React.ReactNode;
  composer: Omit<ChatComposerProps, 'attachments'> & {
    attachments?: ChatComposerProps['attachments'];
  };
  /**
   * Optional overlay (e.g. ScrollToBottomButton).
   */
  overlay?: React.ReactNode;
  style?: ViewStyle;
  composerHorizontalPadding?: number;
  onNearBottomChange?: ChatMessageListProps['onNearBottomChange'];
  listRef?: React.RefObject<ChatMessageListRef | null>;
};

export function ChatPage({
  header,
  messages,
  showTypingIndicator,
  renderMessageContent,
  onRetryMessage,
  isRetryingMessage,
  topBanner,
  composerTop,
  composer,
  overlay,
  style,
  composerHorizontalPadding,
  onNearBottomChange,
  listRef,
}: ChatPageProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [composerHeight, setComposerHeight] = React.useState(0);
  const [composerTopHeight, setComposerTopHeight] = React.useState(0);
  const footerBottomPadding = Platform.OS === 'ios' ? insets.bottom - 24 : insets.bottom + 10;
  const totalComposerHeight = composerHeight + composerTopHeight;
  const overlayBottom = totalComposerHeight + footerBottomPadding + theme.spacing.lg;
  const bottomInset = totalComposerHeight + footerBottomPadding + theme.spacing.xl;

  const resolvedOverlay = React.useMemo(() => {
    if (!overlay) return null;
    if (!React.isValidElement(overlay)) return overlay;
    const prevStyle = (overlay.props as any)?.style;
    return React.cloneElement(overlay as any, {
      style: [prevStyle, { bottom: overlayBottom }],
    });
  }, [overlay, overlayBottom]);

  React.useEffect(() => {
    if (composerTop) return;
    setComposerTopHeight(0);
  }, [composerTop]);
  return (
    <View style={[{ flex: 1 }, style]}>
      {header ? <View>{header}</View> : null}
      {topBanner ? (
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm }}>
          {topBanner}
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <View
          style={{ flex: 1 }}
        >
          <ChatMessageList
            ref={listRef}
            messages={messages}
            showTypingIndicator={showTypingIndicator}
            renderMessageContent={renderMessageContent}
            onRetryMessage={onRetryMessage}
            isRetryingMessage={isRetryingMessage}
            onNearBottomChange={onNearBottomChange}
            bottomInset={bottomInset}
          />
          {resolvedOverlay}
        </View>
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: composerHorizontalPadding ?? theme.spacing.md,
            paddingTop: theme.spacing.sm,
            paddingBottom: footerBottomPadding,
          }}
        >
          {composerTop ? (
            <View
              style={{ marginBottom: theme.spacing.sm }}
              onLayout={(e) => setComposerTopHeight(e.nativeEvent.layout.height)}
            >
              {composerTop}
            </View>
          ) : null}
          <ChatComposer
            {...composer}
            attachments={composer.attachments ?? []}
            onLayout={({ height }) => setComposerHeight(height)}
          />
        </View>
      </View>
    </View>
  );
}


