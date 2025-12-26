import * as React from 'react';

import { appsRepository } from '../../data/apps/repository';
import type { App } from '../../data/apps/types';

export function useAppDetails(appId: string | null) {
  const [app, setApp] = React.useState<App | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!appId) {
      setApp(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await appsRepository.getById(appId);
        if (!cancelled) setApp(res);
      } catch {
        if (!cancelled) setApp(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appId]);

  return { app, loading };
}


