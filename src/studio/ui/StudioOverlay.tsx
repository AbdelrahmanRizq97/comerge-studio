import * as React from 'react';
import { InteractionManager, Keyboard, Platform, View, useWindowDimensions } from 'react-native';

import type { App } from '../../data/apps/types';
import type { RelatedApps } from '../../data/apps/types';
import type { MergeRequest } from '../../data/merge-requests/types';
import { StudioBottomSheet } from '../../components/studio-sheet/StudioBottomSheet';
import { StudioSheetPager } from '../../components/studio-sheet/StudioSheetPager';
import { Bubble } from '../../components/bubble/Bubble';
import { EdgeGlowFrame } from '../../components/overlays/EdgeGlowFrame';
import { DrawModeOverlay } from '../../components/draw/DrawModeOverlay';
import { AppCommentsSheet } from '../../components/comments/AppCommentsSheet';
import { PreviewPanel } from './PreviewPanel';
import { ChatPanel } from './ChatPanel';
import { ConfirmMergeFlow } from './ConfirmMergeFlow';
import type { MergeRequestSummary } from '../../components/models/types';
import { useTheme } from '../../theme';
import { useOptimisticChatMessages } from '../hooks/useOptimisticChatMessages';
import {
  publishComergeStudioUIState,
  startStudioControlPolling,
  type StudioControlOptions,
} from '@comergehq/studio-control';

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
  isBaseBundleDownloading?: boolean;
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
  onSyncUpstream?: () => Promise<{ status: import('../../data/apps/types').SyncUpstreamStatus }>;
  syncingUpstream?: boolean;
  upstreamSyncStatus?: import('../../data/apps/types').SyncUpstreamStatus | null;
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
  chatQueueItems?: import('../../data/apps/edit-queue/types').EditQueueItem[];
  onRemoveQueueItem?: (id: string) => void;
  chatProgress?: import('../hooks/useAgentRunProgress').AgentRunProgressView | null;

  // Navigation callbacks
  onNavigateHome?: () => void;
  showBubble: boolean;
  studioControlOptions?: StudioControlOptions;
  relatedApps?: RelatedApps | null;
  relatedAppsLoading?: boolean;
  switchingRelatedAppId?: string | null;
  onOpenRelatedApps?: () => void;
  onSwitchRelatedApp?: (targetAppId: string) => void;
};

type SheetPage = 'preview' | 'chat';

export function StudioOverlay({
  captureTargetRef,
  app,
  appLoading,
  isOwner,
  shouldForkOnEdit,
  isTesting,
  isBaseBundleDownloading = false,
  onRestoreBase,
  incomingMergeRequests,
  outgoingMergeRequests,
  creatorStatsById,
  processingMrId,
  isBuildingMrTest,
  testingMrId,
  toMergeRequestSummary,
  onSubmitMergeRequest,
  onSyncUpstream,
  syncingUpstream,
  upstreamSyncStatus,
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
  chatQueueItems,
  onRemoveQueueItem,
  chatProgress,
  onNavigateHome,
  showBubble,
  studioControlOptions,
  relatedApps,
  relatedAppsLoading,
  switchingRelatedAppId,
  onOpenRelatedApps,
  onSwitchRelatedApp,
}: StudioOverlayProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const [sheetOpen, setSheetOpen] = React.useState(false);
  const sheetOpenRef = React.useRef(sheetOpen);
  const pendingNavigateHomeRef = React.useRef(false);
  const [activePage, setActivePage] = React.useState<SheetPage>('preview');

  const [drawing, setDrawing] = React.useState(false);
  const [chatAttachments, setChatAttachments] = React.useState<string[]>([]);
  const [commentsAppId, setCommentsAppId] = React.useState<string | null>(null);
  const [commentsCount, setCommentsCount] = React.useState<number | null>(null);

  const threadId = app?.threadId ?? null;
  const isForking = chatForking || app?.status === 'forking';
  const queueItemsForChat = isForking ? [] : chatQueueItems;
  const disableOptimistic = Boolean(queueItemsForChat && queueItemsForChat.length > 0) || app?.status === 'editing';
  const optimistic = useOptimisticChatMessages({
    threadId,
    shouldForkOnEdit,
    disableOptimistic,
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

  const handleNavigateHome = React.useCallback(() => {
    if (!onNavigateHome) return;

    if (Platform.OS !== 'android') {
      onNavigateHome();
      return;
    }

    // On Android Fabric, navigate only after the sheet fully dismisses.
    if (!sheetOpenRef.current) {
      InteractionManager.runAfterInteractions(() => {
        onNavigateHome();
      });
      return;
    }

    pendingNavigateHomeRef.current = true;
    Keyboard.dismiss();
    setActivePage('preview');
    closeSheet();
  }, [closeSheet, onNavigateHome]);

  const handleSheetDismiss = React.useCallback(() => {
    if (Platform.OS !== 'android') return;
    if (!pendingNavigateHomeRef.current) return;
    pendingNavigateHomeRef.current = false;
    InteractionManager.runAfterInteractions(() => {
      onNavigateHome?.();
    });
  }, [onNavigateHome]);

  React.useEffect(() => {
    if (!sheetOpen) {
      return;
    }
    pendingNavigateHomeRef.current = false;
  }, [sheetOpen]);

  React.useEffect(() => {
    return () => {
      pendingNavigateHomeRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    sheetOpenRef.current = sheetOpen;
  }, [sheetOpen]);

  React.useEffect(() => {
    const poller = startStudioControlPolling((action) => {
      if (action === 'show' && !sheetOpenRef.current) openSheet();
      if (action === 'hide' && sheetOpenRef.current) closeSheet();
      if (action === 'toggle') toggleSheet();
    }, studioControlOptions);
    return () => poller.stop();
  }, [closeSheet, openSheet, studioControlOptions, toggleSheet]);

  React.useEffect(() => {
    void publishComergeStudioUIState(sheetOpen, studioControlOptions);
  }, [sheetOpen, studioControlOptions]);

  return (
    <>
      {/* Testing glow around runtime */}
      <EdgeGlowFrame visible={isTesting} role="accent" thickness={40} intensity={1} />

      <StudioBottomSheet open={sheetOpen} onOpenChange={handleSheetOpenChange} onDismiss={handleSheetDismiss}>
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
              onNavigateHome={onNavigateHome ? handleNavigateHome : undefined}
              onGoToChat={goToChat}
              onStartDraw={isOwner ? startDraw : undefined}
              onSubmitMergeRequest={onSubmitMergeRequest}
              onSyncUpstream={onSyncUpstream}
              syncingUpstream={syncingUpstream}
              upstreamSyncStatus={upstreamSyncStatus}
              onRequestApprove={(mr) => setConfirmMrId(mr.id)}
              onReject={onReject}
              onTestMr={handleTestMr}
              onOpenComments={() => setCommentsAppId(app?.id ?? null)}
              commentCountOverride={commentsCount ?? undefined}
              relatedApps={relatedApps}
              relatedAppsLoading={relatedAppsLoading}
              switchingRelatedAppId={switchingRelatedAppId}
              onOpenRelatedApps={onOpenRelatedApps}
              onSwitchRelatedApp={onSwitchRelatedApp}
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
              shouldForkOnEdit={shouldForkOnEdit}
              attachments={chatAttachments}
              onRemoveAttachment={(idx) => setChatAttachments((prev) => prev.filter((_, i) => i !== idx))}
              onClearAttachments={() => setChatAttachments([])}
              onBack={backToPreview}
              onClose={closeSheet}
              onNavigateHome={onNavigateHome ? handleNavigateHome : undefined}
              onStartDraw={startDraw}
              onSend={optimistic.onSend}
              onRetryMessage={optimistic.onRetry}
              isRetryingMessage={optimistic.isRetrying}
              queueItems={queueItemsForChat}
              onRemoveQueueItem={onRemoveQueueItem}
              progress={chatProgress}
            />
          }
        />
      </StudioBottomSheet>

      {showBubble && (
        <Bubble
          visible={!sheetOpen && !drawing}
          ariaLabel={sheetOpen ? 'Hide studio' : 'Show studio'}
          badgeCount={incomingMergeRequests.length}
          onPress={toggleSheet}
          isLoading={app?.status === 'editing' || isBaseBundleDownloading}
          loadingBorderTone={isBaseBundleDownloading ? 'warning' : 'default'}
        >
          <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
            <MergeIcon width={24} height={24} color={theme.colors.floatingContent} />
          </View>
        </Bubble>
      )}

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
        isBuilding={isBuildingMrTest}
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


