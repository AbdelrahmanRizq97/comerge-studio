import type { AttachmentMeta } from '../../attachment/types';

export type EditQueueStatus =
  | 'pending'
  | 'enqueued'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type EditQueueItem = {
  id: string;
  status: EditQueueStatus;
  prompt: string | null;
  messageId: string | null;
  attachments: AttachmentMeta[];
  createdAt: string;
  updatedAt: string;
  runAfter: string | null;
  priority: number;
};

export type EditQueueListResponse = {
  items: EditQueueItem[];
};

export type UpdateEditQueueItemRequest = {
  prompt?: string;
  attachments?: AttachmentMeta[];
  runAfter?: string | null;
};
