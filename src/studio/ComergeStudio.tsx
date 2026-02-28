import * as React from 'react';
import { Platform as RNPlatform, View, type ViewStyle } from 'react-native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import type { ComergeRuntimeSystemEventEnvelope } from '@comergehq/runtime';
import { isSystemEventEnvelope } from '@comergehq/runtime';

import type { Platform as BundlePlatform } from '../data/apps/bundles/types';
import { StudioBootstrap } from './bootstrap/StudioBootstrap';
import { useApp } from './hooks/useApp';
import { useThreadMessages } from './hooks/useThreadMessages';
import { useBundleManager } from './hooks/useBundleManager';
import type { EmbeddedBaseBundles } from './hooks/useBundleManager';
import { useMergeRequests } from './hooks/useMergeRequests';
import { useAttachmentUpload } from './hooks/useAttachmentUpload';
import { useStudioActions } from './hooks/useStudioActions';
import { RuntimeRenderer } from './ui/RuntimeRenderer';
import { StudioOverlay } from './ui/StudioOverlay';
import { LiquidGlassResetProvider } from '../components/utils/liquidGlassReset';
import { useEditQueue } from './hooks/useEditQueue';
import { useEditQueueActions } from './hooks/useEditQueueActions';
import { useAgentRunProgress } from './hooks/useAgentRunProgress';
import { useRelatedApps } from './hooks/useRelatedApps';
import { appsRepository } from '../data/apps/repository';
import type { SyncUpstreamStatus } from '../data/apps/types';
import { log } from '../core/logger';
import {
  trackRelatedAppSwitchFailed,
  trackRelatedAppsOpened,
  trackRelatedAppSwitched,
} from './analytics/track';

export type ComergeStudioProps = {
  appId: string;
  clientKey: string;
  appKey?: string;
  analyticsEnabled?: boolean;
  onNavigateHome?: () => void;
  onOpenAppRequested?: (params: { appId: string; appKey?: string; threadId?: string; source?: string }) => void;
  style?: ViewStyle;
  showBubble?: boolean;
  enableAgentProgress?: boolean;
  studioControlOptions?: import('@comergehq/studio-control').StudioControlOptions;
  embeddedBaseBundles?: EmbeddedBaseBundles;
  onSystemEvent?: (event: ComergeRuntimeSystemEventEnvelope) => void;
};

export function ComergeStudio({
  appId,
  clientKey,
  appKey = 'MicroMain',
  analyticsEnabled,
  onNavigateHome,
  onOpenAppRequested,
  style,
  showBubble = true,
  enableAgentProgress = true,
  studioControlOptions,
  embeddedBaseBundles,
  onSystemEvent,
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
    <StudioBootstrap
      clientKey={clientKey}
      analyticsEnabled={analyticsEnabled}
      fallback={<View style={{ flex: 1 }} />}
    >
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
              onOpenAppRequested={onOpenAppRequested}
              captureTargetRef={captureTargetRef}
              style={style}
              showBubble={showBubble}
              enableAgentProgress={enableAgentProgress}
              studioControlOptions={studioControlOptions}
              embeddedBaseBundles={embeddedBaseBundles}
              onSystemEvent={onSystemEvent}
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
  onOpenAppRequested?: (params: { appId: string; appKey?: string; threadId?: string; source?: string }) => void;
  captureTargetRef: React.RefObject<View | null>;
  style?: ViewStyle;
  showBubble: boolean;
  enableAgentProgress: boolean;
  studioControlOptions?: import('@comergehq/studio-control').StudioControlOptions;
  embeddedBaseBundles?: EmbeddedBaseBundles;
  onSystemEvent?: (event: ComergeRuntimeSystemEventEnvelope) => void;
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
  onOpenAppRequested,
  captureTargetRef,
  style,
  showBubble,
  enableAgentProgress,
  studioControlOptions,
  embeddedBaseBundles,
  onSystemEvent,
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
  const editQueue = useEditQueue(activeAppId);
  const agentProgress = useAgentRunProgress(threadId, { enabled: enableAgentProgress });
  const editQueueActions = useEditQueueActions(activeAppId);
  const [lastEditQueueInfo, setLastEditQueueInfo] = React.useState<{
    queueItemId?: string | null;
    queuePosition?: number | null;
  } | null>(null);
  const lastEditQueueInfoRef = React.useRef<{
    queueItemId?: string | null;
    queuePosition?: number | null;
  } | null>(null);
  const [suppressQueueUntilResponse, setSuppressQueueUntilResponse] = React.useState(false);

  const mergeRequests = useMergeRequests({ appId: activeAppId });
  const hasOpenOutgoingMr = React.useMemo(() => {
    return mergeRequests.lists.outgoing.some((mr) => mr.status === 'open');
  }, [mergeRequests.lists.outgoing]);

  const incomingReviewMrs = React.useMemo(() => {
    if (!userId) return mergeRequests.lists.incoming;
    return mergeRequests.lists.incoming.filter((mr) => mr.createdBy !== userId);
  }, [mergeRequests.lists.incoming, userId]);

  const uploader = useAttachmentUpload();

  const updateLastEditQueueInfo = React.useCallback(
    (info: { queueItemId?: string | null; queuePosition?: number | null } | null) => {
      lastEditQueueInfoRef.current = info;
      setLastEditQueueInfo(info);
    },
    []
  );

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
    stageAttachments: uploader.stageBase64Images,
    onEditStart: () => {
      if (editQueue.items.length === 0) {
        setSuppressQueueUntilResponse(true);
      }
    },
    onEditQueued: (info) => {
      updateLastEditQueueInfo(info);
      if (info.queuePosition !== 1) {
        setSuppressQueueUntilResponse(false);
      }
    },
    onEditFinished: () => {
      if (lastEditQueueInfoRef.current?.queuePosition !== 1) {
        setSuppressQueueUntilResponse(false);
      }
    },
  });

  const chatSendDisabled = false;

  const [processingMrId, setProcessingMrId] = React.useState<string | null>(null);
  const [testingMrId, setTestingMrId] = React.useState<string | null>(null);
  const [syncingUpstream, setSyncingUpstream] = React.useState(false);
  const [upstreamSyncStatus, setUpstreamSyncStatus] = React.useState<SyncUpstreamStatus | null>(null);
  const isMrTestBuildInProgress = bundle.loading && bundle.loadingMode === 'test';
  const isBaseBundleDownloading = bundle.loading && bundle.loadingMode === 'base' && !bundle.isTesting;
  const runtimePreparingText = React.useMemo(() => {
    const status = app?.status;
    if (status === 'ready' && bundle.bundleStatus === 'pending') {
      return 'Bundling app… this may take a few minutes';
    }

    switch (status) {
      case 'creating':
        return 'Creating your app… this may take a moment';
      case 'forking':
        return 'Forking your app…';
      case 'editing':
        return 'Applying your latest changes…';
      case 'merging':
        return 'Merging app updates…';
      case 'error':
        return 'This app hit an error while preparing.';
      default:
        return 'Preparing app…';
    }
  }, [app?.status, bundle.bundleStatus]);

  // Show typing dots when the last message isn't an outcome (agent still working).
  const chatShowTypingIndicator = React.useMemo(() => {
    if (agentProgress.hasLiveProgress) return false;
    if (!thread.raw || thread.raw.length === 0) return false;
    const last = thread.raw[thread.raw.length - 1];
    const payloadType = typeof (last.payload as any)?.type === 'string' ? String((last.payload as any).type) : undefined;
    return payloadType !== 'outcome';
  }, [agentProgress.hasLiveProgress, thread.raw]);
  const showChatProgress = agentProgress.hasLiveProgress || Boolean(agentProgress.view.bundle?.active);

  React.useEffect(() => {
    updateLastEditQueueInfo(null);
    setSuppressQueueUntilResponse(false);
    setUpstreamSyncStatus(null);
  }, [activeAppId, updateLastEditQueueInfo]);

  const handleSyncUpstream = React.useCallback(async () => {
    if (!app?.id) {
      throw new Error('Missing app');
    }
    setSyncingUpstream(true);
    try {
      const result = await appsRepository.syncUpstream(activeAppId);
      setUpstreamSyncStatus(result.status);
      return result;
    } finally {
      setSyncingUpstream(false);
    }
  }, [activeAppId, app?.id]);

  React.useEffect(() => {
    if (!lastEditQueueInfo?.queueItemId) return;
    const stillPresent = editQueue.items.some((item) => item.id === lastEditQueueInfo.queueItemId);
    if (!stillPresent) {
      updateLastEditQueueInfo(null);
      setSuppressQueueUntilResponse(false);
    }
  }, [editQueue.items, lastEditQueueInfo?.queueItemId]);

  const chatQueueItems = React.useMemo(() => {
    if (suppressQueueUntilResponse && editQueue.items.length <= 1) {
      return [];
    }
    if (!lastEditQueueInfo || lastEditQueueInfo.queuePosition !== 1 || !lastEditQueueInfo.queueItemId) {
      return editQueue.items;
    }
    if (
      editQueue.items.length === 1 &&
      editQueue.items[0]?.id === lastEditQueueInfo.queueItemId
    ) {
      return [];
    }
    return editQueue.items;
  }, [editQueue.items, lastEditQueueInfo, suppressQueueUntilResponse]);

  const { relatedApps, loading: relatedAppsLoading } = useRelatedApps(activeAppId);
  const [switchingRelatedAppId, setSwitchingRelatedAppId] = React.useState<string | null>(null);

  const handleOpenRelatedApps = React.useCallback(() => {
    if (!relatedApps) return;
    const ids = new Set<string>();
    ids.add(relatedApps.current.id);
    if (relatedApps.original?.id) ids.add(relatedApps.original.id);
    for (const remix of relatedApps.remixes) ids.add(remix.id);
    void trackRelatedAppsOpened({ appId: relatedApps.current.id, relatedCount: ids.size });
  }, [relatedApps]);

  const handleSwitchRelatedApp = React.useCallback(
    async (targetAppId: string) => {
      if (!targetAppId || targetAppId === activeAppId) return;
      setSwitchingRelatedAppId(targetAppId);
      try {
        const targetApp = await appsRepository.getById(targetAppId);
        if (targetApp.status === 'archived') {
          const reason = 'target_archived';
          log.warn('[related-apps] switch blocked: target app archived', {
            fromAppId: activeAppId,
            toAppId: targetAppId,
            status: targetApp.status,
          });
          await trackRelatedAppSwitchFailed({
            fromAppId: activeAppId,
            toAppId: targetAppId,
            reason,
          });
          return;
        }

        if (onOpenAppRequested) {
          onOpenAppRequested({
            appId: targetAppId,
            appKey,
            threadId: targetApp.threadId ?? undefined,
            source: 'related_apps_switcher',
          });
        } else {
          setActiveAppId(targetAppId);
          setRuntimeAppId(targetAppId);
          setPendingRuntimeTargetAppId(null);
        }

        const targetType = relatedApps?.original?.id === targetAppId ? 'original' : 'remix';
        await trackRelatedAppSwitched({
          fromAppId: activeAppId,
          toAppId: targetAppId,
          targetType,
        });
      } catch (error) {
        log.warn('[related-apps] switch failed', { fromAppId: activeAppId, toAppId: targetAppId, error });
        await trackRelatedAppSwitchFailed({
          fromAppId: activeAppId,
          toAppId: targetAppId,
          reason: 'switch_failed',
          error,
        });
      } finally {
        setSwitchingRelatedAppId(null);
      }
    },
    [
      activeAppId,
      appKey,
      onOpenAppRequested,
      relatedApps?.original?.id,
      setActiveAppId,
      setPendingRuntimeTargetAppId,
      setRuntimeAppId,
    ]
  );

  return (
      <View style={[{ flex: 1 }, style]}>
      <View ref={captureTargetRef} style={{ flex: 1 }} collapsable={false}>
        <RuntimeRenderer
          appKey={appKey}
          bundlePath={bundle.bundlePath}
          runtimeId={`app:${runtimeAppId}`}
          preparingText={runtimePreparingText}
          forcePreparing={showPostEditPreparing}
          renderToken={bundle.renderToken}
          allowInitialPreparing={!embeddedBaseBundles}
          onMessage={(messageEvent) => {
            const envelope = messageEvent.envelope;
            if (!isSystemEventEnvelope(envelope)) {
              log.debug('[runtime-bridge] ignored non-system envelope', {
                type: envelope?.type,
                requestId: envelope?.requestId,
                runtimeId: envelope?.runtimeId,
              });
              return;
            }
            onSystemEvent?.(envelope);
          }}
        />

        <StudioOverlay
          captureTargetRef={captureTargetRef}
          app={app}
          appLoading={appLoading}
          isOwner={actions.isOwner}
          shouldForkOnEdit={actions.shouldForkOnEdit}
          isTesting={bundle.isTesting}
          isBaseBundleDownloading={isBaseBundleDownloading}
          onRestoreBase={async () => {
            setTestingMrId(null);
            await bundle.restoreBase();
          }}
          incomingMergeRequests={incomingReviewMrs}
          outgoingMergeRequests={mergeRequests.lists.outgoing}
          creatorStatsById={mergeRequests.creatorStatsById}
          processingMrId={processingMrId}
          isBuildingMrTest={isMrTestBuildInProgress}
          testingMrId={testingMrId}
          toMergeRequestSummary={mergeRequests.toSummary}
          onSubmitMergeRequest={
            app?.forkedFromAppId && actions.isOwner && !mergeRequests.loading && !hasOpenOutgoingMr
              ? async () => {
                  await mergeRequests.actions.openMergeRequest(activeAppId);
                }
              : undefined
          }
          onSyncUpstream={actions.isOwner && app?.forkedFromAppId ? handleSyncUpstream : undefined}
          syncingUpstream={syncingUpstream}
          upstreamSyncStatus={upstreamSyncStatus}
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
            if (testingMrId === mr.id || bundle.loadingMode === 'test') return;
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
          chatQueueItems={chatQueueItems}
          onRemoveQueueItem={(id) => editQueueActions.cancel(id)}
          chatProgress={showChatProgress ? agentProgress.view : null}
          onNavigateHome={onNavigateHome}
          showBubble={showBubble}
          studioControlOptions={studioControlOptions}
          relatedApps={relatedApps}
          relatedAppsLoading={relatedAppsLoading}
          switchingRelatedAppId={switchingRelatedAppId}
          onOpenRelatedApps={handleOpenRelatedApps}
          onSwitchRelatedApp={handleSwitchRelatedApp}
        />
      </View>
    </View>
  );
}


