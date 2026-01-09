import * as React from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

const LiquidGlassResetContext = React.createContext(0);

export function LiquidGlassResetProvider({
  children,
  resetTriggers = [],
}: {
  children: React.ReactNode;
  resetTriggers?: React.DependencyList;
}) {
  const [token, setToken] = React.useState(0);

  React.useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const onChange = (state: AppStateStatus) => {
      if (state === 'active') setToken((t) => t + 1);
    };

    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  React.useEffect(() => {
    setToken((t) => t + 1);
  }, resetTriggers);

  return <LiquidGlassResetContext.Provider value={token}>{children}</LiquidGlassResetContext.Provider>;
}

export function useLiquidGlassResetToken() {
  return React.useContext(LiquidGlassResetContext);
}

