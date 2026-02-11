import * as React from 'react';
import { Platform, View, type NativeScrollEvent, type NativeSyntheticEvent, type ViewStyle } from 'react-native';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';

import type { ChatMessage } from '../models/types';
import { useTheme } from '../../theme';
import { ChatMessageBubble, type ChatMessageBubbleProps } from './ChatMessageBubble';
import { TypingIndicator } from './TypingIndicator';

export type ChatMessageListRef = {
  scrollToBottom: (options?: { animated?: boolean }) => void;
};

export type ChatMessageListProps = {
  messages: ChatMessage[];
  showTypingIndicator?: boolean;
  renderMessageContent?: ChatMessageBubbleProps['renderContent'];
  onRetryMessage?: (messageId: string) => void;
  isRetryingMessage?: (messageId: string) => boolean;
  contentStyle?: ViewStyle;
  bottomInset?: number;
  /**
   * Called when the user is near the bottom of the list.
   */
  onNearBottomChange?: (nearBottom: boolean) => void;
  /**
   * Distance threshold from bottom (in dp) that counts as "near bottom".
   */
  nearBottomThreshold?: number;
};

export const ChatMessageList = React.forwardRef<ChatMessageListRef, ChatMessageListProps>(
  (
    {
      messages,
      showTypingIndicator = false,
      renderMessageContent,
      onRetryMessage,
      isRetryingMessage,
      contentStyle,
      bottomInset = 0,
      onNearBottomChange,
      nearBottomThreshold = 200,
    },
    ref
  ) => {
    const theme = useTheme();
    const listRef = React.useRef<React.ElementRef<typeof BottomSheetFlatList<ChatMessage>>>(null);
    const nearBottomRef = React.useRef(true);
    const initialScrollDoneRef = React.useRef(false);
    const lastMessageIdRef = React.useRef<string | null>(null);

    const data = React.useMemo(() => {
      return [...messages].reverse();
    }, [messages]);
    const lastMessageId = messages.length > 0 ? messages[messages.length - 1]!.id : null;

    const scrollToBottom = React.useCallback((options?: { animated?: boolean }) => {
      const animated = options?.animated ?? true;
      listRef.current?.scrollToOffset({ offset: 0, animated });
    }, []);

    React.useImperativeHandle(ref, () => ({ scrollToBottom }), [scrollToBottom]);

    const handleScroll = React.useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
        const distanceFromBottom = Math.max(contentOffset.y - Math.max(bottomInset, 0), 0);
        const isNear = distanceFromBottom <= nearBottomThreshold;

        if (nearBottomRef.current !== isNear) {
          nearBottomRef.current = isNear;
          onNearBottomChange?.(isNear);
        }
      },
      [bottomInset, nearBottomThreshold, onNearBottomChange]
    );


    // When new messages arrive, keep the user pinned to the bottom only if they already were near it.
    React.useEffect(() => {
      if (!initialScrollDoneRef.current) return;
      const lastId = messages.length > 0 ? messages[messages.length - 1]!.id : null;
      const prevLastId = lastMessageIdRef.current;
      lastMessageIdRef.current = lastId;
      if (!lastId || lastId === prevLastId) return;
      if (!nearBottomRef.current) return;

      const id = requestAnimationFrame(() => scrollToBottom({ animated: true }));
      return () => cancelAnimationFrame(id);
    }, [messages, scrollToBottom]);

    // When typing indicator appears, keep the user at bottom if they already were.
    React.useEffect(() => {
      if (showTypingIndicator && nearBottomRef.current) {
        const id = requestAnimationFrame(() => scrollToBottom({ animated: true }));
        return () => cancelAnimationFrame(id);
      }
      return undefined;
    }, [showTypingIndicator, scrollToBottom]);

    return (
      <BottomSheetFlatList
        ref={listRef}
        inverted
        data={data}
        keyExtractor={(m: ChatMessage) => m.id}
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (initialScrollDoneRef.current) return;
          initialScrollDoneRef.current = true;
          lastMessageIdRef.current = messages.length > 0 ? messages[messages.length - 1]!.id : null;
          nearBottomRef.current = true;
          onNearBottomChange?.(true);
          requestAnimationFrame(() => scrollToBottom({ animated: false }));
        }}
        contentContainerStyle={[
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
          },
          contentStyle,
        ]}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
        renderItem={({ item }: { item: ChatMessage }) => (
          <ChatMessageBubble
            message={item}
            renderContent={renderMessageContent}
            isLast={Boolean(lastMessageId && item.id === lastMessageId)}
            retrying={isRetryingMessage?.(item.id) ?? false}
            onRetry={onRetryMessage ? () => onRetryMessage(item.id) : undefined}
          />
        )}
        ListHeaderComponent={
          <View>
            {showTypingIndicator ? (
              <View style={{ marginTop: theme.spacing.sm, alignSelf: 'flex-start', paddingHorizontal: theme.spacing.lg }}>
                <TypingIndicator />
              </View>
            ) : null}
            {bottomInset > 0 ? <View style={{ height: bottomInset }} /> : null}
          </View>
        }
      />
    );
  }
);
ChatMessageList.displayName = 'ChatMessageList';


