import * as React from 'react';

import { setClientApiKey } from '../../core/services/http/public';
import { ensureAuthenticatedSession, ensureAnonymousSession } from '../../core/services/supabase/auth';
import { isSupabaseClientInjected, setSupabaseConfig } from '../../core/services/supabase/client';
import { studioConfigRepository } from '../../data/public/studio-config/repository';

export type UseStudioBootstrapOptions = {
  apiKey: string;
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
        setClientApiKey(options.apiKey);
        const requireAuth = isSupabaseClientInjected();
        if (!requireAuth) {
          const cfg = await studioConfigRepository.get();
          setSupabaseConfig(cfg);
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
  }, [options.apiKey]);

  return state;
}


