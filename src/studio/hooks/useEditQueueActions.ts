import * as React from 'react';

import type { UpdateEditQueueItemRequest } from '../../data/apps/edit-queue/types';
import { editQueueRepository } from '../../data/apps/edit-queue/repository';

export type UseEditQueueActionsResult = {
  update: (queueItemId: string, payload: UpdateEditQueueItemRequest) => Promise<void>;
  cancel: (queueItemId: string) => Promise<void>;
};

export function useEditQueueActions(appId: string): UseEditQueueActionsResult {
  const update = React.useCallback(
    async (queueItemId: string, payload: UpdateEditQueueItemRequest) => {
      if (!appId) return;
      await editQueueRepository.update(appId, queueItemId, payload);
    },
    [appId]
  );

  const cancel = React.useCallback(
    async (queueItemId: string) => {
      if (!appId) return;
      await editQueueRepository.cancel(appId, queueItemId);
    },
    [appId]
  );

  return { update, cancel };
}
