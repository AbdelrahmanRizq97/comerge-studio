import * as React from 'react';

import type { App } from '../../data/apps/types';
import { appsRepository } from '../../data/apps/repository';
import { useForegroundSignal } from './useForegroundSignal';

export type UseAppResult = {
  app: App | null;
  loading: boolean;
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
  const [error, setError] = React.useState<Error | null>(null);
  const foregroundSignal = useForegroundSignal(enabled && Boolean(appId));

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

  const fetchOnce = React.useCallback(async () => {
    if (!enabled) return;
    if (!appId) return;
    setLoading(true);
    setError(null);
    try {
      const next = await appsRepository.getById(appId);
      setApp((prev) => mergeApp(prev, next));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setApp(null);
    } finally {
      setLoading(false);
    }
  }, [appId, enabled]);

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
    void fetchOnce();
  }, [appId, enabled, fetchOnce, foregroundSignal]);

  return { app, loading, error, refetch: fetchOnce };
}


