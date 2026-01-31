import * as React from 'react';
import { ActivityIndicator, Platform, Share, View } from 'react-native';

import type { App } from '../../data/apps/types';
import type { MergeRequest } from '../../data/merge-requests/types';
import { log } from '../../core/logger';
import { PreviewPage } from '../../components/preview/PreviewPage';
import { Text } from '../../components/primitives/Text';
import { PreviewPanelHeader } from './preview-panel/PreviewPanelHeader';
import { PreviewHeroSection } from './preview-panel/PreviewHeroSection';
import { PreviewMetaSection } from './preview-panel/PreviewMetaSection';
import { PreviewCustomizeSection } from './preview-panel/PreviewCustomizeSection';
import { PreviewCollaborateSection } from './preview-panel/PreviewCollaborateSection';
import { usePreviewPanelData } from './preview-panel/usePreviewPanelData';

export type PreviewPanelProps = {
  app: App | null;
  loading?: boolean;
  isOwner: boolean;
  shouldForkOnEdit: boolean;
  incomingMergeRequests: MergeRequest[];
  outgoingMergeRequests: MergeRequest[];
  creatorStatsById: Record<string, import('../../data/users/types').UserStats>;
  processingMrId?: string | null;
  isBuildingMrTest?: boolean;
  testingMrId?: string | null;
  toMergeRequestSummary: (mr: MergeRequest) => import('../../components/models/types').MergeRequestSummary;
  onClose: () => void;
  onNavigateHome?: () => void;
  onGoToChat: () => void;
  onStartDraw?: () => void;
  onSubmitMergeRequest?: () => void | Promise<void>;
  onRequestApprove?: (mr: MergeRequest) => void;
  onReject?: (mr: MergeRequest) => void | Promise<void>;
  onTestMr?: (mr: MergeRequest) => void | Promise<void>;
  onOpenComments?: () => void;
  commentCountOverride?: number;
};

export function PreviewPanel({
  app,
  loading,
  isOwner,
  shouldForkOnEdit,
  incomingMergeRequests,
  outgoingMergeRequests,
  creatorStatsById,
  processingMrId,
  isBuildingMrTest,
  testingMrId,
  toMergeRequestSummary,
  onClose,
  onNavigateHome,
  onGoToChat,
  onStartDraw,
  onSubmitMergeRequest,
  onRequestApprove,
  onReject,
  onTestMr,
  onOpenComments,
  commentCountOverride,
}: PreviewPanelProps) {
  const handleShare = React.useCallback(async () => {
    if (!app || !app.isPublic) return;
    const shareUrl = `https://remix.one/app/${app.id}`;
    const message = app.name ? `${app.name} on Remix\n${shareUrl}` : `Check out this app on Remix\n${shareUrl}`;
    try {
      const title = app.name ?? 'Remix app';
      const payload =
        Platform.OS === 'ios'
          ? {
              title,
              message,
            }
          : {
              title,
              message,
              url: shareUrl,
            };
      await Share.share(payload);
    } catch (error) {
      log.warn('PreviewPanel share failed', error);
    }
  }, [app]);

  const { imageUrl, imageLoaded, setImageLoaded, creator, insights, stats, showProcessing, canSubmitMergeRequest } = usePreviewPanelData({
    app,
    isOwner,
    outgoingMergeRequests,
    onOpenComments,
    commentCountOverride,
  });

  const header = (
    <PreviewPanelHeader
      isOwner={isOwner}
      isPublic={Boolean(app?.isPublic)}
      onClose={onClose}
      onNavigateHome={onNavigateHome}
      onGoToChat={onGoToChat}
      onShare={handleShare}
    />
  );

  if (loading || !app) {
    return (
      <PreviewPage header={header}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <ActivityIndicator />
          <View style={{ height: 12 }} />
          <Text variant="bodyMuted">Loading app…</Text>
        </View>
      </PreviewPage>
    );
  }

  return (
    <PreviewPage header={header}>
      <PreviewHeroSection
        appStatus={app.status}
        showProcessing={showProcessing}
        imageUrl={imageUrl}
        imageLoaded={imageLoaded}
        onImageLoad={() => setImageLoaded(true)}
        stats={{
          likeCount: stats.likeCount,
          commentCount: stats.commentCount,
          forkCount: stats.forkCount,
          isLiked: stats.isLiked,
          handleLike: stats.handleLike,
          handleOpenComments: stats.handleOpenComments,
        }}
      />

      <PreviewMetaSection app={app} isOwner={isOwner} creator={creator} downloadsCount={insights.downloads} />

      <PreviewCustomizeSection
        app={app}
        isOwner={isOwner}
        shouldForkOnEdit={shouldForkOnEdit}
        showProcessing={showProcessing}
        onGoToChat={onGoToChat}
        onStartDraw={onStartDraw}
      />

      <PreviewCollaborateSection
        canSubmitMergeRequest={canSubmitMergeRequest}
        incomingMergeRequests={incomingMergeRequests}
        outgoingMergeRequests={outgoingMergeRequests}
        creatorStatsById={creatorStatsById}
        processingMrId={processingMrId}
        isBuildingMrTest={isBuildingMrTest}
        testingMrId={testingMrId}
        toMergeRequestSummary={toMergeRequestSummary}
        onSubmitMergeRequest={onSubmitMergeRequest}
        onRequestApprove={onRequestApprove}
        onReject={onReject}
        onTestMr={onTestMr}
      />
    </PreviewPage>
  );
}


