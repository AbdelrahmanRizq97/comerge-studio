import * as React from 'react';
import { View, type NativeScrollEvent, type NativeSyntheticEvent, type ViewStyle } from 'react-native';
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
  contentStyle?: ViewStyle;
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
      contentStyle,
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

    const scrollToBottom = React.useCallback((options?: { animated?: boolean }) => {
      const animated = options?.animated ?? true;
      // Scroll to visual bottom (latest messages) in a normal (non-inverted) list.
      listRef.current?.scrollToEnd({ animated });
    }, []);

    React.useImperativeHandle(ref, () => ({ scrollToBottom }), [scrollToBottom]);

    const handleScroll = React.useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
        const distanceFromBottom = Math.max(contentSize.height - (contentOffset.y + layoutMeasurement.height), 0);
        const isNear = distanceFromBottom <= nearBottomThreshold;

        if (nearBottomRef.current !== isNear) {
          nearBottomRef.current = isNear;
          onNearBottomChange?.(isNear);
        }
      },
      [nearBottomThreshold, onNearBottomChange]
    );

    // On first load, start at the bottom
    React.useEffect(() => {
      if (initialScrollDoneRef.current) return;
      if (messages.length === 0) return;

      initialScrollDoneRef.current = true;
      lastMessageIdRef.current = messages[messages.length - 1]?.id ?? null;
      const id = requestAnimationFrame(() => scrollToBottom({ animated: false }));
      return () => cancelAnimationFrame(id);
    }, [messages, scrollToBottom]);

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
        data={messages}
        keyExtractor={(m: ChatMessage) => m.id}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          {
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.sm,
            paddingBottom: theme.spacing.xl,
          },
          contentStyle,
        ]}
        renderItem={({ item, index }: { item: ChatMessage; index: number }) => (
          <View style={{ marginTop: index === 0 ? 0 : theme.spacing.sm }}>
            <ChatMessageBubble message={item} renderContent={renderMessageContent} />
          </View>
        )}
        ListFooterComponent={
          showTypingIndicator ? (
            <View style={{ marginTop: theme.spacing.sm, alignSelf: 'flex-start', paddingHorizontal: theme.spacing.lg }}>
              <TypingIndicator />
            </View>
          ) : null
        }
        maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: nearBottomThreshold }}
      />
    );
  }
);
ChatMessageList.displayName = 'ChatMessageList';


