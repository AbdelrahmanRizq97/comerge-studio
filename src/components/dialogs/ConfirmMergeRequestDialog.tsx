import * as React from 'react';
import { Pressable, View } from 'react-native';

import type { MergeRequestSummary } from '../models/types';
import { Modal } from '../primitives/Modal';
import { Text } from '../primitives/Text';
import { useTheme } from '../../theme';

export type ConfirmMergeRequestDialogProps = {
  visible: boolean;
  onOpenChange: (open: boolean) => void;
  mergeRequest: MergeRequestSummary | null;
  approveDisabled?: boolean;
  /**
   * disables the "Test edits first" button and changes its label to "Preparing…".
   */
  isBuilding?: boolean;
  onConfirm: () => void | Promise<void>;
  onTestFirst: (mr: MergeRequestSummary) => void | Promise<void>;
};

export function ConfirmMergeRequestDialog({
  visible,
  onOpenChange,
  mergeRequest,
  approveDisabled,
  isBuilding,
  onConfirm,
  onTestFirst,
}: ConfirmMergeRequestDialogProps) {
  const theme = useTheme();

  const close = React.useCallback(() => onOpenChange(false), [onOpenChange]);

  const canConfirm = Boolean(mergeRequest) && !approveDisabled;

  const handleConfirm = React.useCallback(() => {
    if (!mergeRequest) return;
    onOpenChange(false);
    void onConfirm();
  }, [mergeRequest, onConfirm, onOpenChange]);

  const handleTestFirst = React.useCallback(() => {
    if (!mergeRequest) return;
    onOpenChange(false);
    void onTestFirst(mergeRequest);
  }, [mergeRequest, onOpenChange, onTestFirst]);

  const fullWidthButtonBase = {
    height: 40,
    borderRadius: 999,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    alignSelf: 'stretch' as const,
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={close}
      contentStyle={{
        borderRadius: theme.radii.sm,
        padding: 24,
        backgroundColor: theme.colors.background,
      }}
    >
      <View>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: 18,
            lineHeight: 24,
            fontWeight: theme.typography.fontWeight.semibold,
          }}
        >
          Are you sure you want to approve this merge request?
        </Text>
      </View>

      <View style={{ marginTop: 16 }}>
        {/* Primary */}
        <View
          style={[
            fullWidthButtonBase,
            {
              backgroundColor: theme.colors.primary,
              opacity: canConfirm ? 1 : 0.5,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Approve Merge"
            disabled={!canConfirm}
            onPress={handleConfirm}
            style={[fullWidthButtonBase, { flex: 1 }]}
          >
            <Text style={{ textAlign: 'center', color: theme.colors.onPrimary }}>
              Approve Merge
            </Text>
          </Pressable>
        </View>

        {/* Test first (outline) */}
        <View style={{ height: 8 }} />
        <View
          style={[
            fullWidthButtonBase,
            {
              backgroundColor: theme.colors.background,
              borderWidth: 1,
              borderColor: theme.colors.border,
              opacity: isBuilding || !mergeRequest ? 0.5 : 1,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isBuilding ? 'Preparing…' : 'Test edits first'}
            disabled={isBuilding || !mergeRequest}
            onPress={handleTestFirst}
            style={[fullWidthButtonBase, { flex: 1 }]}
          >
            <Text style={{ textAlign: 'center', color: theme.colors.text }}>
              {isBuilding ? 'Preparing…' : 'Test edits first'}
            </Text>
          </Pressable>
        </View>

        {/* Cancel (outline) */}
        <View style={{ height: 8 }} />
        <View
          style={[
            fullWidthButtonBase,
            {
              backgroundColor: theme.colors.background,
              borderWidth: 1,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={close}
            style={[fullWidthButtonBase, { flex: 1 }]}
          >
            <Text style={{ textAlign: 'center', color: theme.colors.text }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}


