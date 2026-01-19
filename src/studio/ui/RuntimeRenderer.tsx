import * as React from 'react';
import { View, type ViewStyle } from 'react-native';

import { ComergeRuntimeRenderer } from '@comergehq/runtime';

import { Text } from '../../components/primitives/Text';

export type RuntimeRendererProps = {
  appKey: string;
  bundlePath: string | null;
  /**
   * When true, show the "Preparing app…" UI even if a previous bundle is available.
   * Used to avoid briefly rendering an outdated bundle during post-edit base refresh.
   */
  forcePreparing?: boolean;
  /**
   * When false, suppress "Preparing app…" on the very first load.
   */
  allowInitialPreparing?: boolean;
  /**
   * Used to force a runtime remount even when bundlePath stays constant
   * (e.g. base bundle replaced in-place).
   */
  renderToken?: number;
  style?: ViewStyle;
};

export function RuntimeRenderer({
  appKey,
  bundlePath,
  forcePreparing,
  renderToken,
  style,
  allowInitialPreparing = true,
}: RuntimeRendererProps) {
  const [hasRenderedOnce, setHasRenderedOnce] = React.useState(false);

  React.useEffect(() => {
    if (bundlePath) {
      setHasRenderedOnce(true);
    }
  }, [bundlePath]);

  if (!bundlePath || forcePreparing) {
    if (!hasRenderedOnce && !forcePreparing && !allowInitialPreparing) {
      return <View style={[{ flex: 1 }, style]} />;
    }

    return (
      <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }, style]}>
        <Text variant="bodyMuted">Preparing app…</Text>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1 }, style]}>
      <ComergeRuntimeRenderer
        key={`${appKey}:${bundlePath}:${renderToken ?? 0}`}
        appKey={appKey}
        bundlePath={bundlePath}
        style={{ flex: 1 }}
      />
    </View>
  );
}


