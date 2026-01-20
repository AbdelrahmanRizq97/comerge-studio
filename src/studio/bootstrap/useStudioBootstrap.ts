import * as React from 'react';

import { setClientKey } from '../../core/services/http/public';
import { ensureAuthenticatedSession, ensureAnonymousSession } from '../../core/services/supabase/auth';
import { isSupabaseClientInjected, setSupabaseConfig } from '../../core/services/supabase/client';
const SUPABASE_URL = 'https://xtfxwbckjpfmqubnsusu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0Znh3YmNranBmbXF1Ym5zdXN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDEyMzAsImV4cCI6MjA3NjE3NzIzMH0.dzWGAWrK4CvrmHVHzf8w7JlUZohdap0ZPnLZnABMV8s';

export type UseStudioBootstrapOptions = {
  clientKey: string;
};

export type StudioBootstrapState = {
  ready: boolean;
  userId: string | null;
  error: Error | null;
};

export function useStudioBootstrap(options: UseStudioBootstrapOptions): StudioBootstrapState {
  const [state, setState] = React.useState<StudioBootstrapState>({
    ready: false,
    userId: null,
    error: null,
  });

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setClientKey(options.clientKey);
        const requireAuth = isSupabaseClientInjected();
        if (!requireAuth) {
          setSupabaseConfig({ url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY });
        }
        const { user } = requireAuth ? await ensureAuthenticatedSession() : await ensureAnonymousSession();

        if (cancelled) return;
        setState({ ready: true, userId: user.id, error: null });
      } catch (e) {
        if (cancelled) return;
        const err = e instanceof Error ? e : new Error(String(e));
        setState({ ready: false, userId: null, error: err });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [options.clientKey]);

  return state;
}


