import * as React from 'react';

import type { RelatedApps } from '../../data/apps/types';
import { appsRepository } from '../../data/apps/repository';
import { log } from '../../core/logger';

export type UseRelatedAppsResult = {
  relatedApps: RelatedApps | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useRelatedApps(appId: string): UseRelatedAppsResult {
  const [relatedApps, setRelatedApps] = React.useState<RelatedApps | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const requestSeqRef = React.useRef(0);

  const fetchRelatedApps = React.useCallback(async () => {
    if (!appId) {
      setRelatedApps(null);
      setError(null);
      setLoading(false);
      return;
    }

    const requestSeq = ++requestSeqRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await appsRepository.getRelated(appId);
      if (requestSeq !== requestSeqRef.current) return;
      setRelatedApps(data);
    } catch (err) {
      if (requestSeq !== requestSeqRef.current) return;
      const normalized = err instanceof Error ? err : new Error(String(err));
      // Related apps are optional UI data; degrade silently and keep preview stable.
      log.warn('[related-apps] failed to load', { appId, error: normalized.message });
      setError(normalized);
      setRelatedApps(null);
    } finally {
      if (requestSeq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  }, [appId]);

  React.useEffect(() => {
    void fetchRelatedApps();
  }, [fetchRelatedApps]);

  return {
    relatedApps,
    loading,
    error,
    refetch: fetchRelatedApps,
  };
}

