import * as React from 'react';
import { LiquidGlassView } from '@callstack/liquid-glass';

import { useLiquidGlassResetToken } from './liquidGlassReset';

export type ResettableLiquidGlassViewProps = React.ComponentProps<typeof LiquidGlassView>;

export function ResettableLiquidGlassView({ children, ...props }: ResettableLiquidGlassViewProps) {
  const token = useLiquidGlassResetToken();
  const [layoutBootKey, setLayoutBootKey] = React.useState(0);
  const sawNonZeroLayoutRef = React.useRef(false);

  const onLayout: NonNullable<ResettableLiquidGlassViewProps['onLayout']> = (e) => {
    props.onLayout?.(e);
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0 && !sawNonZeroLayoutRef.current) {
      sawNonZeroLayoutRef.current = true;
      setLayoutBootKey((k) => k + 1);
    }
  };

  return (
    <LiquidGlassView key={`liquid-glass-${token}-${layoutBootKey}`} {...props} onLayout={onLayout}>
      {children}
    </LiquidGlassView>
  );
}

