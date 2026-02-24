import * as React from 'react';
import { View, type ViewStyle } from 'react-native';

import { ComergeRuntimeRenderer } from '@comergehq/runtime';
import type { ComergeRuntimeViewMessageEvent } from '@comergehq/runtime';

import { Text } from '../../components/primitives/Text';

export type RuntimeRendererProps = {
  appKey: string;
  bundlePath: string | null;
  runtimeId?: string;
  /**
   * Loading text shown while runtime cannot render a bundle yet.
   */
  preparingText?: string;
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
  onMessage?: (event: ComergeRuntimeViewMessageEvent) => void;
  style?: ViewStyle;
};

export function RuntimeRenderer({
  appKey,
  bundlePath,
  runtimeId,
  preparingText,
  forcePreparing,
  renderToken,
  onMessage,
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
        <Text variant="bodyMuted">{preparingText ?? 'Preparing app…'}</Text>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1 }, style]}>
      <ComergeRuntimeRenderer
        key={`${appKey}:${bundlePath}:${renderToken ?? 0}`}
        appKey={appKey}
        bundlePath={bundlePath}
        runtimeId={runtimeId}
        onMessage={onMessage}
        style={{ flex: 1 }}
      />
    </View>
  );
}


