import * as React from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { getSupabaseClient } from '../../core/services/supabase';

export function useForegroundSignal(enabled: boolean = true): number {
  const [signal, setSignal] = React.useState(0);
  const lastStateRef = React.useRef<AppStateStatus>(AppState.currentState);

  React.useEffect(() => {
    if (!enabled) return;

    const sub = AppState.addEventListener('change', (nextState) => {
      const prevState = lastStateRef.current;
      lastStateRef.current = nextState;

      const didResume =
        (prevState === 'background' || prevState === 'inactive') && nextState === 'active';
      if (!didResume) return;

      try {
        const supabase = getSupabaseClient();
        supabase?.realtime?.connect?.();
      } catch {
        
      }

      setSignal((s) => s + 1);
    });

    return () => sub.remove();
  }, [enabled]);

  return signal;
}


