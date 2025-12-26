import * as React from 'react';
import {
  Modal as RNModal,
  Pressable,
  View,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../../theme';
import { Card } from './Card';

export type ModalProps = {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  /**
   * When true, tapping the backdrop closes the modal.
   */
  dismissOnBackdropPress?: boolean;
  contentStyle?: ViewStyle;
};

export function Modal({
  visible,
  onRequestClose,
  dismissOnBackdropPress = true,
  children,
  contentStyle,
}: ModalProps) {
  const theme = useTheme();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={{ flex: 1, backgroundColor: theme.colors.backdrop, justifyContent: 'center', padding: theme.spacing.lg }}>
        <Pressable
          accessibilityRole="button"
          onPress={dismissOnBackdropPress ? onRequestClose : undefined}
          style={{ position: 'absolute', inset: 0 }}
        />
        <Card variant="surfaceRaised" padded style={[{ borderRadius: theme.radii.xl }, contentStyle]}>
          {children}
        </Card>
      </View>
    </RNModal>
  );
}


