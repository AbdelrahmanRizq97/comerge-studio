import * as React from 'react';

import type { App } from '../../../data/apps/types';
import type { MergeRequest } from '../../../data/merge-requests/types';
import { appImagesRepository } from '../../../data/apps/images/repository';
import { appsRepository } from '../../../data/apps/repository';
import { usersRepository } from '../../../data/users/repository';
import { log } from '../../../core/logger';
import { useAppStats } from '../../hooks/useAppStats';

type InsightsSummary = { likes: number; comments: number; forks: number; downloads: number };

const LIKE_DEBUG_PREFIX = '[COMERGE_LIKE_DEBUG]';

export function usePreviewPanelData(params: {
  app: App | null;
  isOwner: boolean;
  outgoingMergeRequests: MergeRequest[];
  onOpenComments?: () => void;
  commentCountOverride?: number;
}) {
  const { app, isOwner, outgoingMergeRequests, onOpenComments, commentCountOverride } = params;

  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [insights, setInsights] = React.useState<InsightsSummary>({ likes: 0, comments: 0, forks: 0, downloads: 0 });
  const [creator, setCreator] = React.useState<{ name: string | null; avatar: string | null } | null>(null);

  React.useEffect(() => {
    if (!app?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await appImagesRepository.getSignedUrl(app.id);
        if (!cancelled) setImageUrl(res.url);
      } catch {
        if (!cancelled) setImageUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [app?.id]);

  React.useEffect(() => {
    if (!app?.createdBy) return;
    let cancelled = false;
    (async () => {
      try {
        const stats = await usersRepository.getStats(app.createdBy);
        if (cancelled) return;
        setCreator({ name: stats.name, avatar: stats.avatar });
      } catch {
        if (!cancelled) setCreator(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [app?.createdBy]);

  React.useEffect(() => {
    setImageLoaded(false);
  }, [app?.id]);

  React.useEffect(() => {
    if (!app?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const full = await appsRepository.getInsights(app.id);
        if (cancelled) return;
        log.debug(
          `${LIKE_DEBUG_PREFIX} usePreviewPanelData.getInsights appId=${app.id} insights.likes.total=${full.likes.total} app.isLiked=${String(
            app.isLiked
          )}`
        );
        setInsights({
          likes: full.likes.total,
          comments: full.comments.total,
          forks: full.forks.total,
          downloads: full.downloads.total,
        });
      } catch {
        // Leave zeros
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [app?.id]);

  React.useEffect(() => {
    if (!app?.id) return;
    log.debug(
      `${LIKE_DEBUG_PREFIX} usePreviewPanelData.appChanged appId=${app.id} app.isLiked=${String(app.isLiked)}`
    );
  }, [app?.id, app?.isLiked]);

  const stats = useAppStats({
    appId: app?.id ?? '',
    initialLikes: insights.likes,
    initialForks: insights.forks,
    initialComments: commentCountOverride ?? insights.comments,
    initialIsLiked: Boolean(app?.isLiked),
    onOpenComments,
    interactionSource: 'preview_panel',
  });

  const canSubmitMergeRequest = React.useMemo(() => {
    if (!isOwner) return false;
    if (!app) return false;
    if (!app.forkedFromAppId) return false;
    if (outgoingMergeRequests.some((mr) => mr.status === 'open')) return false;
    if (app.headCommitId && app.forkedFromCommitId && app.headCommitId !== app.forkedFromCommitId) return true;
    return false;
  }, [app, isOwner, outgoingMergeRequests]);

  const canSyncUpstream = React.useMemo(() => {
    if (!isOwner) return false;
    if (!app) return false;
    if (!app.forkedFromAppId) return false;
    return app.status === 'ready';
  }, [app, isOwner]);

  const showProcessing = app ? app.status !== 'ready' : false;

  return {
    imageUrl,
    imageLoaded,
    setImageLoaded,
    creator,
    insights,
    stats,
    showProcessing,
    canSubmitMergeRequest,
    canSyncUpstream,
  };
}


