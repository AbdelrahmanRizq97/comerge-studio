import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';

import type { ChatMessageListRef } from '../../components/chat/ChatMessageList';
import { ChatPage } from '../../components/chat/ChatPage';
import { ScrollToBottomButton } from '../../components/chat/ScrollToBottomButton';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { ForkNoticeBanner } from '../../components/chat/ForkNoticeBanner';
import { StudioSheetHeaderIconButton } from '../../components/studio-sheet/StudioSheetHeaderIconButton';
import { IconArrowDown, IconBack, IconClose, IconDraw, IconHome } from '../../components/icons/StudioIcons';
import { Text } from '../../components/primitives/Text';
import type { ChatMessage } from '../../components/models/types';

export type ChatPanelProps = {
  title?: string;
  autoFocusComposer?: boolean;
  messages: ChatMessage[];
  showTypingIndicator?: boolean;
  loading?: boolean;
  sendDisabled?: boolean;
  forking?: boolean;
  sending?: boolean;
  shouldForkOnEdit?: boolean;
  attachments?: string[];
  onRemoveAttachment?: (index: number) => void;
  onClearAttachments?: () => void;
  onBack: () => void;
  onClose: () => void;
  onNavigateHome?: () => void;
  onStartDraw?: () => void;
  onSend: (text: string, attachments?: string[]) => void | Promise<void>;
};

export function ChatPanel({
  title = 'Chat',
  autoFocusComposer = false,
  messages,
  showTypingIndicator,
  loading,
  sendDisabled,
  forking = false,
  sending,
  shouldForkOnEdit,
  attachments = [],
  onRemoveAttachment,
  onClearAttachments,
  onBack,
  onClose,
  onNavigateHome,
  onStartDraw,
  onSend,
}: ChatPanelProps) {
  const listRef = React.useRef<ChatMessageListRef | null>(null);
  const [nearBottom, setNearBottom] = React.useState(true);

  const handleSend = React.useCallback(
    async (text: string, composerAttachments?: string[]) => {
      const all = composerAttachments ?? attachments;
      await onSend(text, all.length > 0 ? all : undefined);
      onClearAttachments?.();
      requestAnimationFrame(() => listRef.current?.scrollToBottom({ animated: true }));
    },
    [attachments, onClearAttachments, onSend]
  );

  const handleScrollToBottom = React.useCallback(() => {
    listRef.current?.scrollToBottom({ animated: true });
  }, []);

  const header = (
    <ChatHeader
      left={
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <StudioSheetHeaderIconButton onPress={onBack} accessibilityLabel="Back" style={{ marginRight: 8 }}>
            <IconBack size={20} colorToken="floatingContent" />
          </StudioSheetHeaderIconButton>
          {onNavigateHome ? (
            <StudioSheetHeaderIconButton onPress={onNavigateHome} accessibilityLabel="Home">
              <IconHome size={20} colorToken="floatingContent" />
            </StudioSheetHeaderIconButton>
          ) : null}
        </View>
      }
      right={
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {onStartDraw ? (
            <StudioSheetHeaderIconButton onPress={onStartDraw} accessibilityLabel="Draw" intent="danger" style={{ marginRight: 8 }}>
              <IconDraw size={20} colorToken="onDanger" />
            </StudioSheetHeaderIconButton>
          ) : null}
          <StudioSheetHeaderIconButton onPress={onClose} accessibilityLabel="Close">
            <IconClose size={20} colorToken="floatingContent" />
          </StudioSheetHeaderIconButton>
        </View>
      }
      center={null}
    />
  );

  const topBanner =
    shouldForkOnEdit ? (
      <ForkNoticeBanner
        isOwner={!shouldForkOnEdit}
        style={{ marginBottom: 12 }}
      />
    ) : null;

  const showMessagesLoading = (Boolean(loading) && messages.length === 0) || forking;
  if (showMessagesLoading) {
    return (
      <View style={{ flex: 1 }}>
        <View>{header}</View>
        {topBanner ? <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>{topBanner}</View> : null}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 12 }}>
          <ActivityIndicator />
          <View style={{ height: 12 }} />
          <Text variant="bodyMuted">{forking ? 'Creating your copy…' : 'Loading messages…'}</Text>
        </View>
      </View>
    );
  }

  return (
    <ChatPage
      header={header}
      messages={messages}
      showTypingIndicator={showTypingIndicator}
      topBanner={topBanner}
      listRef={listRef}
      onNearBottomChange={setNearBottom}
      overlay={
        <ScrollToBottomButton
          visible={!nearBottom}
          onPress={handleScrollToBottom}
          style={{ bottom: 80 }}
        >
          <IconArrowDown size={20} colorToken="floatingContent" />
        </ScrollToBottomButton>
      }
      composer={{
        disabled: Boolean(loading) || Boolean(sendDisabled) || Boolean(forking),
        sending: Boolean(sending),
        autoFocus: autoFocusComposer,
        onSend: handleSend,
        attachments,
        onRemoveAttachment: onRemoveAttachment,
        onAddAttachment: onStartDraw,
        useBottomSheetTextInput: true,
      }}
    />
  );
}


