import * as React from 'react';
import { Platform as RNPlatform, View, type ViewStyle } from 'react-native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import type { Platform as BundlePlatform } from '../data/apps/bundles/types';
import { StudioBootstrap } from './bootstrap/StudioBootstrap';
import { useApp } from './hooks/useApp';
import { useThreadMessages } from './hooks/useThreadMessages';
import { useBundleManager } from './hooks/useBundleManager';
import type { EmbeddedBaseBundles } from './hooks/useBundleManager';
import { useMergeRequests } from './hooks/useMergeRequests';
import { useAttachmentUpload } from './hooks/useAttachmentUpload';
import { useStudioActions } from './hooks/useStudioActions';
import { hasNoOutcomeAfterLastHuman } from './lib/chat';
import { RuntimeRenderer } from './ui/RuntimeRenderer';
import { StudioOverlay } from './ui/StudioOverlay';
import { LiquidGlassResetProvider } from '../components/utils/liquidGlassReset';

export type ComergeStudioProps = {
  appId: string;
  clientKey: string;
  appKey?: string;
  onNavigateHome?: () => void;
  style?: ViewStyle;
  showBubble?: boolean;
  studioControlOptions?: import('@comergehq/studio-control').StudioControlOptions;
  embeddedBaseBundles?: EmbeddedBaseBundles;
};

export function ComergeStudio({
  appId,
  clientKey,
  appKey = 'MicroMain',
  onNavigateHome,
  style,
  showBubble = true,
  studioControlOptions,
  embeddedBaseBundles,
}: ComergeStudioProps) {
  const [activeAppId, setActiveAppId] = React.useState(appId);
  const [runtimeAppId, setRuntimeAppId] = React.useState(appId);
  const [pendingRuntimeTargetAppId, setPendingRuntimeTargetAppId] = React.useState<string | null>(null);
  const platform = React.useMemo<BundlePlatform>(() => (RNPlatform.OS === 'ios' ? 'ios' : 'android'), []);

  React.useEffect(() => {
    setActiveAppId(appId);
    setRuntimeAppId(appId);
    setPendingRuntimeTargetAppId(null);
  }, [appId]);

  const captureTargetRef = React.useRef<View | null>(null);

  return (
    <StudioBootstrap clientKey={clientKey} fallback={<View style={{ flex: 1 }} />}>
      {({ userId }) => (
        <BottomSheetModalProvider>
          <LiquidGlassResetProvider resetTriggers={[appId, activeAppId, runtimeAppId]}>
            <ComergeStudioInner
              userId={userId}
              activeAppId={activeAppId}
              setActiveAppId={setActiveAppId}
              runtimeAppId={runtimeAppId}
              setRuntimeAppId={setRuntimeAppId}
              pendingRuntimeTargetAppId={pendingRuntimeTargetAppId}
              setPendingRuntimeTargetAppId={setPendingRuntimeTargetAppId}
              appKey={appKey}
              platform={platform}
              onNavigateHome={onNavigateHome}
              captureTargetRef={captureTargetRef}
              style={style}
              showBubble={showBubble}
              studioControlOptions={studioControlOptions}
              embeddedBaseBundles={embeddedBaseBundles}
            />
          </LiquidGlassResetProvider>
        </BottomSheetModalProvider>
      )}
    </StudioBootstrap>
  );
}

type InnerProps = {
  userId: string;
  activeAppId: string;
  setActiveAppId: (id: string) => void;
  runtimeAppId: string;
  setRuntimeAppId: (id: string) => void;
  pendingRuntimeTargetAppId: string | null;
  setPendingRuntimeTargetAppId: (id: string | null) => void;
  appKey: string;
  platform: BundlePlatform;
  onNavigateHome?: () => void;
  captureTargetRef: React.RefObject<View | null>;
  style?: ViewStyle;
  showBubble: boolean;
  studioControlOptions?: import('@comergehq/studio-control').StudioControlOptions;
  embeddedBaseBundles?: EmbeddedBaseBundles;
};

function ComergeStudioInner({
  userId,
  activeAppId,
  setActiveAppId,
  runtimeAppId,
  setRuntimeAppId,
  pendingRuntimeTargetAppId,
  setPendingRuntimeTargetAppId,
  appKey,
  platform,
  onNavigateHome,
  captureTargetRef,
  style,
  showBubble,
  studioControlOptions,
  embeddedBaseBundles,
}: InnerProps) {
  const { app, loading: appLoading } = useApp(activeAppId);
  const { app: runtimeAppFromHook } = useApp(runtimeAppId, { enabled: runtimeAppId !== activeAppId });
  const runtimeApp = runtimeAppId === activeAppId ? app : runtimeAppFromHook;

  // When we fork+edit, we keep rendering the original app until the forked app completes the edit.
  // We unlock the runtime switch once we observe the forked app go editing -> ready.
  const sawEditingOnPendingTargetRef = React.useRef(false);
  React.useEffect(() => {
    sawEditingOnPendingTargetRef.current = false;
  }, [pendingRuntimeTargetAppId]);

  React.useEffect(() => {
    if (!pendingRuntimeTargetAppId) return;
    if (activeAppId !== pendingRuntimeTargetAppId) return;
    if (app?.status === 'editing') {
      sawEditingOnPendingTargetRef.current = true;
    }
    if (sawEditingOnPendingTargetRef.current && app?.status === 'ready') {
      setRuntimeAppId(pendingRuntimeTargetAppId);
      setPendingRuntimeTargetAppId(null);
      sawEditingOnPendingTargetRef.current = false;
    }
  }, [activeAppId, app?.status, app?.id, pendingRuntimeTargetAppId, setPendingRuntimeTargetAppId, setRuntimeAppId]);

  const bundle = useBundleManager({
    base: { appId: runtimeAppId, commitId: runtimeApp?.headCommitId ?? undefined },
    platform,
    canRequestLatest: runtimeApp?.status === 'ready',
    embeddedBaseBundles,
  });

  const sawEditingOnActiveAppRef = React.useRef(false);
  const [showPostEditPreparing, setShowPostEditPreparing] = React.useState(false);
  React.useEffect(() => {
    sawEditingOnActiveAppRef.current = false;
    setShowPostEditPreparing(false);
  }, [activeAppId]);

  React.useEffect(() => {
    if (!app?.id) return;
    if (app.status === 'editing') {
      sawEditingOnActiveAppRef.current = true;
      setShowPostEditPreparing(false);
      return;
    }
    if (app.status === 'ready' && sawEditingOnActiveAppRef.current) {
      setShowPostEditPreparing(true);
      sawEditingOnActiveAppRef.current = false;
    }
  }, [app?.id, app?.status]);

  React.useEffect(() => {
    if (!showPostEditPreparing) return;
    const stillProcessingBaseBundle = bundle.loading && bundle.loadingMode === 'base' && !bundle.isTesting;
    if (!stillProcessingBaseBundle) {
      setShowPostEditPreparing(false);
    }
  }, [showPostEditPreparing, bundle.loading, bundle.loadingMode, bundle.isTesting]);

  const threadId = app?.threadId ?? '';
  const thread = useThreadMessages(threadId);

  const mergeRequests = useMergeRequests({ appId: activeAppId });
  const hasOpenOutgoingMr = React.useMemo(() => {
    return mergeRequests.lists.outgoing.some((mr) => mr.status === 'open');
  }, [mergeRequests.lists.outgoing]);

  const incomingReviewMrs = React.useMemo(() => {
    if (!userId) return mergeRequests.lists.incoming;
    return mergeRequests.lists.incoming.filter((mr) => mr.createdBy !== userId);
  }, [mergeRequests.lists.incoming, userId]);

  const uploader = useAttachmentUpload();

  const actions = useStudioActions({
    userId,
    app,
    onForkedApp: (id, opts) => {
      setActiveAppId(id);
      const keepRenderingAppId = opts?.keepRenderingAppId;
      if (keepRenderingAppId) {
        setRuntimeAppId(keepRenderingAppId);
        setPendingRuntimeTargetAppId(id);
      } else {
        setRuntimeAppId(id);
        setPendingRuntimeTargetAppId(null);
      }
    },
    uploadAttachments: uploader.uploadBase64Images,
  });

  const chatSendDisabled = hasNoOutcomeAfterLastHuman(thread.raw);

  const [processingMrId, setProcessingMrId] = React.useState<string | null>(null);
  const [testingMrId, setTestingMrId] = React.useState<string | null>(null);

  // Show typing dots when the last message isn't an outcome (agent still working).
  const chatShowTypingIndicator = React.useMemo(() => {
    if (!thread.raw || thread.raw.length === 0) return false;
    const last = thread.raw[thread.raw.length - 1];
    const payloadType = typeof (last.payload as any)?.type === 'string' ? String((last.payload as any).type) : undefined;
    return payloadType !== 'outcome';
  }, [thread.raw]);

  return (
      <View style={[{ flex: 1 }, style]}>
      <View ref={captureTargetRef} style={{ flex: 1 }} collapsable={false}>
        <RuntimeRenderer
          appKey={appKey}
          bundlePath={bundle.bundlePath}
          forcePreparing={showPostEditPreparing}
          renderToken={bundle.renderToken}
          allowInitialPreparing={!embeddedBaseBundles}
        />

        <StudioOverlay
          captureTargetRef={captureTargetRef}
          app={app}
          appLoading={appLoading}
          isOwner={actions.isOwner}
          shouldForkOnEdit={actions.shouldForkOnEdit}
          isTesting={bundle.isTesting}
          onRestoreBase={async () => {
            setTestingMrId(null);
            await bundle.restoreBase();
          }}
          incomingMergeRequests={incomingReviewMrs}
          outgoingMergeRequests={mergeRequests.lists.outgoing}
          creatorStatsById={mergeRequests.creatorStatsById}
          processingMrId={processingMrId}
          isBuildingMrTest={bundle.loading}
          testingMrId={testingMrId}
          toMergeRequestSummary={mergeRequests.toSummary}
          onSubmitMergeRequest={
            app?.forkedFromAppId && actions.isOwner && !hasOpenOutgoingMr
              ? async () => {
                  await mergeRequests.actions.openMergeRequest(activeAppId);
                }
              : undefined
          }
          onApprove={async (mr) => {
            if (processingMrId) return;
            setProcessingMrId(mr.id);
            try {
              await mergeRequests.actions.approve(mr.id);
            } finally {
              setProcessingMrId(null);
            }
          }}
          onReject={async (mr) => {
            if (processingMrId) return;
            setProcessingMrId(mr.id);
            try {
              await mergeRequests.actions.reject(mr.id);
            } finally {
              setProcessingMrId(null);
            }
          }}
          onTestMr={async (mr) => {
            setTestingMrId(mr.id);
            await bundle.loadTest({ appId: mr.sourceAppId, commitId: mr.sourceTipCommitId ?? mr.sourceCommitId });
          }}
          chatMessages={thread.messages}
          chatLoading={thread.loading}
          chatSendDisabled={chatSendDisabled}
          chatForking={actions.forking}
          chatSending={actions.sending}
          chatShowTypingIndicator={chatShowTypingIndicator}
          onSendChat={(text, attachments) => actions.sendEdit({ prompt: text, attachments })}
          onNavigateHome={onNavigateHome}
          showBubble={showBubble}
          studioControlOptions={studioControlOptions}
        />
      </View>
    </View>
  );
}


