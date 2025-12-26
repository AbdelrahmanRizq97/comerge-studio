import * as React from 'react';

import type { MergeRequest } from '../../data/merge-requests/types';
import { ConfirmMergeRequestDialog } from '../../components/dialogs/ConfirmMergeRequestDialog';
import type { MergeRequestSummary } from '../../components/models/types';

export type ConfirmMergeFlowProps = {
  visible: boolean;
  onOpenChange: (open: boolean) => void;
  mergeRequest: MergeRequest | null;
  toSummary: (mr: MergeRequest) => MergeRequestSummary;
  /**
   * Disable the primary "Approve Merge" action (e.g. while submitting).
   */
  approveDisabled?: boolean;
  /**
   * Whether the system is building/preparing a test bundle.
   * Disables the "Test edits first" action and shows "Preparing…".
   */
  isBuilding?: boolean;
  onConfirm: (mr: MergeRequest) => void | Promise<void>;
  onTestFirst: (mr: MergeRequest) => void | Promise<void>;
};

export function ConfirmMergeFlow({
  visible,
  onOpenChange,
  mergeRequest,
  toSummary,
  approveDisabled,
  isBuilding,
  onConfirm,
  onTestFirst,
}: ConfirmMergeFlowProps) {
  return (
    <ConfirmMergeRequestDialog
      visible={visible}
      onOpenChange={onOpenChange}
      mergeRequest={mergeRequest ? toSummary(mergeRequest) : null}
      approveDisabled={approveDisabled}
      isBuilding={isBuilding}
      onConfirm={() => {
        if (!mergeRequest) return;
        return onConfirm(mergeRequest);
      }}
      onTestFirst={(mrSummary) => {
        if (!mergeRequest) return;
        void mrSummary;
        return onTestFirst(mergeRequest);
      }}
    />
  );
}


