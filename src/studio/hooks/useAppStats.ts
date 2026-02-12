import * as React from 'react';
import * as Haptics from 'expo-haptics';

import type { App } from '../../data/apps/types';
import { appLikesRepository } from '../../data/likes/repository';
import type { InteractionSource } from '../analytics/events';
import { trackLikeApp, trackOpenComments, trackUnlikeApp } from '../analytics/track';

export type UseAppStatsParams = {
  appId: string;
  initialLikes?: number;
  initialComments?: number;
  initialForks?: number;
  initialIsLiked?: boolean;
  onOpenComments?: () => void;
  interactionSource?: InteractionSource;
};

export type AppStatsResult = {
  likeCount: number;
  commentCount: number;
  forkCount: number;
  isLiked: boolean;
  setCommentCount: (count: number) => void;
  handleLike: () => Promise<void>;
  handleOpenComments: () => void;
};

export function useAppStats({
  appId,
  initialLikes = 0,
  initialComments = 0,
  initialForks = 0,
  initialIsLiked = false,
  onOpenComments,
  interactionSource = 'unknown',
}: UseAppStatsParams): AppStatsResult {
  const [likeCount, setLikeCount] = React.useState(initialLikes);
  const [commentCount, setCommentCount] = React.useState(initialComments);
  const [forkCount, setForkCount] = React.useState(initialForks);
  const [isLiked, setIsLiked] = React.useState(initialIsLiked);

  const didMutateRef = React.useRef(false);
  const lastAppIdRef = React.useRef<string>('');
  React.useEffect(() => {
    if (lastAppIdRef.current === appId) return;
    lastAppIdRef.current = appId;
    didMutateRef.current = false;
  }, [appId]);

  React.useEffect(() => {
    if (didMutateRef.current) return;
    setLikeCount(initialLikes);
  }, [appId, initialLikes]);
  React.useEffect(() => {
    if (didMutateRef.current) return;
    setCommentCount(initialComments);
  }, [appId, initialComments]);
  React.useEffect(() => {
    if (didMutateRef.current) return;
    setForkCount(initialForks);
  }, [appId, initialForks]);
  React.useEffect(() => {
    if (didMutateRef.current) return;
    setIsLiked(initialIsLiked);
  }, [appId, initialIsLiked]);

  const handleLike = React.useCallback(async () => {
    if (!appId) return;
    didMutateRef.current = true;
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
    }

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount((prev) => Math.max(0, prev + (newIsLiked ? 1 : -1)));

    try {
      if (newIsLiked) {
        const res = await appLikesRepository.create(appId, {});
        if (typeof res.stats?.total === 'number') setLikeCount(Math.max(0, res.stats.total));
        await trackLikeApp({ appId, source: interactionSource, success: true });
      } else {
        const res = await appLikesRepository.removeMine(appId);
        if (typeof res.stats?.total === 'number') setLikeCount(Math.max(0, res.stats.total));
        await trackUnlikeApp({ appId, source: interactionSource, success: true });
      }
    } catch (e) {
      setIsLiked(!newIsLiked);
      setLikeCount((prev) => Math.max(0, prev + (newIsLiked ? -1 : 1)));
      if (newIsLiked) {
        await trackLikeApp({ appId, source: interactionSource, success: false, error: e });
      } else {
        await trackUnlikeApp({ appId, source: interactionSource, success: false, error: e });
      }
    }
  }, [appId, interactionSource, isLiked, likeCount]);

  const handleOpenComments = React.useCallback(() => {
    if (!appId) return;
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
    }
    void trackOpenComments({ appId, source: interactionSource });
    onOpenComments?.();
  }, [appId, interactionSource, onOpenComments]);

  return { likeCount, commentCount, forkCount, isLiked, setCommentCount, handleLike, handleOpenComments };
}

export function getAppStatsFromApp(app: App | null): Omit<UseAppStatsParams, 'appId'> {
  return {
    initialLikes: app?.insights?.totalLikes ?? 0,
    initialComments: app?.insights?.totalComments ?? 0,
    initialForks: app?.insights?.totalForks ?? 0,
    initialIsLiked: Boolean(app?.isLiked),
  };
}


