import * as React from 'react';

import type { App } from '../../data/apps/types';
import { appsRepository } from '../../data/apps/repository';
import { useForegroundSignal } from './useForegroundSignal';

export type UseAppResult = {
  app: App | null;
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export type UseAppOptions = {
  /**
   * When false, this hook won't fetch or subscribe.
   * Useful to avoid duplicate Supabase channel subscriptions for the same app id.
   */
  enabled?: boolean;
};

export function useApp(appId: string, options?: UseAppOptions): UseAppResult {
  const enabled = options?.enabled ?? true;
  const [app, setApp] = React.useState<App | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const foregroundSignal = useForegroundSignal(enabled && Boolean(appId));
  const hasLoadedOnceRef = React.useRef(false);

  React.useEffect(() => {
    hasLoadedOnceRef.current = false;
  }, [appId]);

  const mergeApp = React.useCallback((prev: App | null, next: App): App => {
    // Realtime (Supabase) rows don't include "viewer-specific" fields like `isLiked`,
    // and may omit derived fields like `insights`. Preserve those from the last REST fetch.
    const merged: App = {
      ...(prev ?? ({} as App)),
      ...next,
      isLiked: next.isLiked ?? prev?.isLiked,
      insights: next.insights ?? prev?.insights,
    };
    return merged;
  }, []);

  const fetchOnce = React.useCallback(async (opts?: { background?: boolean }) => {
    if (!enabled) return;
    if (!appId) return;
    const isBackground = Boolean(opts?.background);
    const useBackgroundRefresh = isBackground && hasLoadedOnceRef.current;
    if (useBackgroundRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const next = await appsRepository.getById(appId);
      hasLoadedOnceRef.current = true;
      setApp((prev) => mergeApp(prev, next));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setApp(null);
    } finally {
      if (useBackgroundRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [appId, enabled, mergeApp]);

  React.useEffect(() => {
    if (!enabled) return;
    void fetchOnce();
  }, [enabled, fetchOnce]);

  React.useEffect(() => {
    if (!enabled) return;
    if (!appId) return;
    const unsubscribe = appsRepository.subscribeApp(appId, {
      onInsert: (a) => {
        setApp((prev) => mergeApp(prev, a));
      },
      onUpdate: (a) => {
        setApp((prev) => mergeApp(prev, a));
      },
      onDelete: () => {
        setApp(null);
      },
    });
    return unsubscribe;
  }, [appId, enabled, mergeApp, foregroundSignal]);

  React.useEffect(() => {                                   
    if (!enabled) return;
    if (!appId) return;
    if (foregroundSignal <= 0) return;
    void fetchOnce({ background: true });
  }, [appId, enabled, fetchOnce, foregroundSignal]);

  return { app, loading, refreshing, error, refetch: fetchOnce };
}


