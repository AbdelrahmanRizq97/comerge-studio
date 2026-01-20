import * as React from 'react';
import { View } from 'react-native';

import { Text } from '../../components/primitives/Text';
import { useStudioBootstrap, type UseStudioBootstrapOptions } from './useStudioBootstrap';

export type StudioBootstrapProps = UseStudioBootstrapOptions & {
  children: React.ReactNode | ((params: { userId: string }) => React.ReactNode);
  /**
   * Optional custom loading UI.
   */
  fallback?: React.ReactNode;
  /**
   * Optional custom error UI. If not provided, a minimal message is shown.
   */
  renderError?: (error: Error) => React.ReactNode;
};

export function StudioBootstrap({ children, fallback, renderError, clientKey }: StudioBootstrapProps) {
  const { ready, error, userId } = useStudioBootstrap({ clientKey });

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        {renderError ? renderError(error) : <Text variant="bodyMuted">{error.message}</Text>}
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        {fallback ?? <Text variant="bodyMuted">Loading…</Text>}
      </View>
    );
  }

  if (typeof children === 'function') {
    return <>{children({ userId: userId ?? '' })}</>;
  }

  return <>{children}</>;
}


