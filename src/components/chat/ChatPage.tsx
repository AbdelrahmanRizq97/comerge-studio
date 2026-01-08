import * as React from 'react';
import { Keyboard, Platform, View, type ViewStyle } from 'react-native';
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
  topBanner?: React.ReactNode;
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
  topBanner,
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
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const show = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const footerBottomPadding = Platform.OS === 'ios' ? (keyboardVisible ? 0 : insets.bottom) : insets.bottom + 10;
  const overlayBottom = composerHeight + footerBottomPadding + theme.spacing.lg;
  const bottomInset = composerHeight + footerBottomPadding + theme.spacing.xl;

  const resolvedOverlay = React.useMemo(() => {
    if (!overlay) return null;
    if (!React.isValidElement(overlay)) return overlay;
    const prevStyle = (overlay.props as any)?.style;
    return React.cloneElement(overlay as any, {
      style: [prevStyle, { bottom: overlayBottom }],
    });
  }, [overlay, overlayBottom]);
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


