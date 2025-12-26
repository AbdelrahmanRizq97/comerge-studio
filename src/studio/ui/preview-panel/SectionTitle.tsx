import * as React from 'react';

import { Text } from '../../../components/primitives/Text';
import { useTheme } from '../../../theme';

export type SectionTitleProps = {
  children: string;
  marginTop?: number;
};

export function SectionTitle({ children, marginTop }: SectionTitleProps) {
  const theme = useTheme();
  return (
    <Text
      style={{
        color: theme.colors.textMuted,
        fontSize: 12,
        lineHeight: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: marginTop ?? theme.spacing.sm,
        marginBottom: theme.spacing.sm,
        fontWeight: theme.typography.fontWeight.bold,
      }}
    >
      {children}
    </Text>
  );
}


