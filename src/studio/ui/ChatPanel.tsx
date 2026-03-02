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
import type { EditQueueItem } from '../../data/apps/edit-queue/types';
import { ChatQueue } from '../../components/chat/ChatQueue';
import { AgentProgressCard } from '../../components/chat/AgentProgressCard';
import { BundleProgressCard } from '../../components/chat/BundleProgressCard';
import type { AgentRunProgressView } from '../hooks/useAgentRunProgress';
import { useTheme } from '../../theme';

export type ChatPanelProps = {
  title?: string;
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
  onRetryMessage?: (messageId: string) => void | Promise<void>;
  isRetryingMessage?: (messageId: string) => boolean;
  onAttachmentLoadError?: (messageId: string, attachmentId: string) => void;
  queueItems?: EditQueueItem[];
  onRemoveQueueItem?: (id: string) => void;
  progress?: AgentRunProgressView | null;
};

export function ChatPanel({
  title = 'Chat',
  messages,
  showTypingIndicator,
  loading,
  sendDisabled,
  forking: _forking = false,
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
  onRetryMessage,
  isRetryingMessage,
  onAttachmentLoadError,
  queueItems = [],
  onRemoveQueueItem,
  progress = null,
}: ChatPanelProps) {
  const theme = useTheme();
  const listRef = React.useRef<ChatMessageListRef | null>(null);
  const [nearBottom, setNearBottom] = React.useState(true);

  const handleSend = React.useCallback(
    async (text: string, composerAttachments?: string[]) => {
      const all = composerAttachments ?? attachments;
      await onSend(text, all.length > 0 ? all : undefined);
      onClearAttachments?.();
      // Avoid double-scroll: ChatMessageList already auto-scrolls when the user is near bottom.
      if (!nearBottom) {
        requestAnimationFrame(() => listRef.current?.scrollToBottom({ animated: true }));
      }
    },
    [attachments, nearBottom, onClearAttachments, onSend]
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

  const showMessagesLoading = Boolean(loading) && messages.length === 0;
  if (showMessagesLoading) {
    return (
      <View style={{ flex: 1 }}>
        <View>{header}</View>
        {topBanner ? <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>{topBanner}</View> : null}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 12 }}>
          <ActivityIndicator />
          <View style={{ height: 12 }} />
          <Text variant="bodyMuted">Loading messages…</Text>
        </View>
      </View>
    );
  }

  const bundleProgress = progress?.bundle ?? null;
  const queueTop = progress || queueItems.length > 0 ? (
    <View style={{ gap: theme.spacing.sm }}>
      {progress ? (bundleProgress ? <BundleProgressCard progress={bundleProgress} /> : <AgentProgressCard progress={progress} />) : null}
      {!progress && queueItems.length > 0 ? <ChatQueue items={queueItems} onRemove={onRemoveQueueItem} /> : null}
    </View>
  ) : null;

  return (
    <ChatPage
      header={header}
      messages={messages}
      showTypingIndicator={showTypingIndicator}
      onRetryMessage={onRetryMessage}
      isRetryingMessage={isRetryingMessage}
      onAttachmentLoadError={onAttachmentLoadError}
      topBanner={topBanner}
      composerTop={queueTop}
      composerHorizontalPadding={0}
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
        // Keep the input editable even when sending is disallowed (e.g. agent still working),
        // otherwise iOS will drop focus/keyboard and BottomSheet can get "stuck" with a keyboard-sized gap.
        disabled: Boolean(loading),
        sendDisabled: Boolean(sendDisabled) || Boolean(loading),
        sending: Boolean(sending),
        onSend: handleSend,
        attachments,
        onRemoveAttachment: onRemoveAttachment,
        onAddAttachment: onStartDraw,
        useBottomSheetTextInput: true,
      }}
    />
  );
}


