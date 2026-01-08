import * as React from 'react';
import { Keyboard, Platform, View, useWindowDimensions } from 'react-native';

import type { App } from '../../data/apps/types';
import type { MergeRequest } from '../../data/merge-requests/types';
import { StudioBottomSheet } from '../../components/studio-sheet/StudioBottomSheet';
import { StudioSheetPager } from '../../components/studio-sheet/StudioSheetPager';
import { FloatingDraggableButton } from '../../components/floating-draggable-button/FloatingDraggableButton';
import { EdgeGlowFrame } from '../../components/overlays/EdgeGlowFrame';
import { DrawModeOverlay } from '../../components/draw/DrawModeOverlay';
import { AppCommentsSheet } from '../../components/comments/AppCommentsSheet';
import { PreviewPanel } from './PreviewPanel';
import { ChatPanel } from './ChatPanel';
import { ConfirmMergeFlow } from './ConfirmMergeFlow';
import type { MergeRequestSummary } from '../../components/models/types';
import { useTheme } from '../../theme';
import { useOptimisticChatMessages } from '../hooks/useOptimisticChatMessages';

import { MergeIcon } from '../../components/icons/MergeIcon';

export type StudioOverlayProps = {
  captureTargetRef: React.RefObject<View | null>;

  app: App | null;
  appLoading?: boolean;

  // Studio state
  isOwner: boolean;
  shouldForkOnEdit: boolean;

  // Bundle testing (glow + restore)
  isTesting: boolean;
  onRestoreBase: () => void | Promise<void>;

  // Merge requests
  incomingMergeRequests: MergeRequest[];
  outgoingMergeRequests: MergeRequest[];
  creatorStatsById: Record<string, import('../../data/users/types').UserStats>;
  processingMrId?: string | null;
  isBuildingMrTest?: boolean;
  testingMrId?: string | null;
  toMergeRequestSummary: (mr: MergeRequest) => MergeRequestSummary;
  onSubmitMergeRequest?: () => void | Promise<void>;
  onApprove?: (mr: MergeRequest) => void | Promise<void>;
  onReject?: (mr: MergeRequest) => void | Promise<void>;
  onTestMr?: (mr: MergeRequest) => void | Promise<void>;

  // Chat
  chatMessages: import('../../components/models/types').ChatMessage[];
  chatLoading?: boolean;
  chatSendDisabled?: boolean;
  chatForking?: boolean;
  chatSending?: boolean;
  chatShowTypingIndicator?: boolean;
  onSendChat: (text: string, attachments?: string[]) => void | Promise<void>;

  // Navigation callbacks
  onNavigateHome?: () => void;
};

type SheetPage = 'preview' | 'chat';

export function StudioOverlay({
  captureTargetRef,
  app,
  appLoading,
  isOwner,
  shouldForkOnEdit,
  isTesting,
  onRestoreBase,
  incomingMergeRequests,
  outgoingMergeRequests,
  creatorStatsById,
  processingMrId,
  isBuildingMrTest,
  testingMrId,
  toMergeRequestSummary,
  onSubmitMergeRequest,
  onApprove,
  onReject,
  onTestMr,
  chatMessages,
  chatLoading,
  chatSendDisabled,
  chatForking,
  chatSending,
  chatShowTypingIndicator,
  onSendChat,
  onNavigateHome,
}: StudioOverlayProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [activePage, setActivePage] = React.useState<SheetPage>('preview');

  const [drawing, setDrawing] = React.useState(false);
  const [chatAttachments, setChatAttachments] = React.useState<string[]>([]);
  const [commentsAppId, setCommentsAppId] = React.useState<string | null>(null);
  const [commentsCount, setCommentsCount] = React.useState<number | null>(null);

  const threadId = app?.threadId ?? null;
  const optimistic = useOptimisticChatMessages({
    threadId,
    shouldForkOnEdit,
    chatMessages,
    onSendChat,
  });

  const [confirmMrId, setConfirmMrId] = React.useState<string | null>(null);
  const confirmMr = React.useMemo(
    () => (confirmMrId ? incomingMergeRequests.find((m) => m.id === confirmMrId) ?? null : null),
    [confirmMrId, incomingMergeRequests]
  );

  const handleSheetOpenChange = React.useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) Keyboard.dismiss();
  }, []);

  const closeSheet = React.useCallback(() => {
    handleSheetOpenChange(false);
  }, [handleSheetOpenChange]);

  const openSheet = React.useCallback(() => setSheetOpen(true), []);

  const goToChat = React.useCallback(() => {
    setActivePage('chat');
    openSheet();
  }, [openSheet]);

  const backToPreview = React.useCallback(() => {
    if (Platform.OS !== 'ios') {
      Keyboard.dismiss();
      setActivePage('preview');
      return;
    }

    let done = false;
    const finalize = () => {
      if (done) return;
      done = true;
      sub.remove();
      clearTimeout(t);
      setActivePage('preview');
    };

    const sub = Keyboard.addListener('keyboardDidHide', finalize);
    const t = setTimeout(finalize, 350);
    Keyboard.dismiss();
  }, []);

  const startDraw = React.useCallback(() => {
    setDrawing(true);
    closeSheet();
  }, [closeSheet]);

  const handleDrawCapture = React.useCallback(
    (dataUrl: string) => {
      setChatAttachments((prev) => [...prev, dataUrl]);
      setDrawing(false);
      setActivePage('chat');
      openSheet();
    },
    [openSheet]
  );

  const toggleSheet = React.useCallback(async () => {
    if (!sheetOpen) {
      const shouldExitTest = Boolean(testingMrId) || isTesting;
      if (shouldExitTest) {
        void Promise.resolve(onRestoreBase()).catch(() => {});
      }
      setSheetOpen(true);
    } else {
      closeSheet();
    }
  }, [closeSheet, isTesting, onRestoreBase, sheetOpen, testingMrId]);

  const handleTestMr = React.useCallback(
    async (mr: MergeRequest) => {
      if (!onTestMr) return;
      await onTestMr(mr);
      closeSheet();
    },
    [closeSheet, onTestMr]
  );

  return (
    <>
      {/* Testing glow around runtime */}
      <EdgeGlowFrame visible={isTesting} role="accent" thickness={40} intensity={1} />

      <StudioBottomSheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <StudioSheetPager
          activePage={activePage}
          width={width}
          preview={
            <PreviewPanel
              app={app}
              loading={appLoading}
              isOwner={isOwner}
              shouldForkOnEdit={shouldForkOnEdit}
              incomingMergeRequests={incomingMergeRequests}
              outgoingMergeRequests={outgoingMergeRequests}
              creatorStatsById={creatorStatsById}
              processingMrId={processingMrId}
              isBuildingMrTest={isBuildingMrTest}
              testingMrId={testingMrId}
              toMergeRequestSummary={toMergeRequestSummary}
              onClose={closeSheet}
              onNavigateHome={onNavigateHome}
              onGoToChat={goToChat}
              onStartDraw={isOwner ? startDraw : undefined}
              onSubmitMergeRequest={onSubmitMergeRequest}
              onRequestApprove={(mr) => setConfirmMrId(mr.id)}
              onReject={onReject}
              onTestMr={handleTestMr}
              onOpenComments={() => setCommentsAppId(app?.id ?? null)}
              commentCountOverride={commentsCount ?? undefined}
            />
          }
          chat={
            <ChatPanel
              messages={optimistic.messages}
              showTypingIndicator={chatShowTypingIndicator}
              loading={chatLoading}
              sendDisabled={chatSendDisabled}
              forking={chatForking}
              sending={chatSending}
              autoFocusComposer={sheetOpen && activePage === 'chat'}
              shouldForkOnEdit={shouldForkOnEdit}
              attachments={chatAttachments}
              onRemoveAttachment={(idx) => setChatAttachments((prev) => prev.filter((_, i) => i !== idx))}
              onClearAttachments={() => setChatAttachments([])}
              onBack={backToPreview}
              onClose={closeSheet}
              onNavigateHome={onNavigateHome}
              onStartDraw={startDraw}
              onSend={optimistic.onSend}
            />
          }
        />
      </StudioBottomSheet>

      <FloatingDraggableButton
        visible={!sheetOpen && !drawing}
        ariaLabel={sheetOpen ? 'Hide studio' : 'Show studio'}
        badgeCount={incomingMergeRequests.length}
        onPress={toggleSheet}
        isLoading={app?.status === 'editing'}
      >
        <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
          <MergeIcon width={24} height={24} color={theme.colors.floatingContent} />
        </View>
      </FloatingDraggableButton>

      <DrawModeOverlay
        visible={drawing}
        captureTargetRef={captureTargetRef}
        onCancel={() => setDrawing(false)}
        onCapture={handleDrawCapture}
      />

      <ConfirmMergeFlow
        visible={Boolean(confirmMr)}
        onOpenChange={(open) => {
          if (!open) setConfirmMrId(null);
        }}
        mergeRequest={confirmMr}
        toSummary={toMergeRequestSummary}
        onConfirm={(mr) => onApprove?.(mr)}
        onTestFirst={handleTestMr}
      />

      <AppCommentsSheet
        appId={commentsAppId}
        onClose={() => setCommentsAppId(null)}
        onCountChange={(count) => setCommentsCount(count)}
        onPlayApp={() => setCommentsAppId(null)}
      />
    </>
  );
}


