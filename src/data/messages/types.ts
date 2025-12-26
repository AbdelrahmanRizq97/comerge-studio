export type Message = {
  id: string;
  appId: string;
  threadId: string;
  commitId: string | null;
  parentMessageId: string | null;
  authorType: 'human' | 'ai';
  userId: string | null;
  payload: {
    attachments?: AttachmentMeta[];
    [key: string]: unknown;
  };
  referenceId: string | null;
  createdAt: string;
  updatedAt: string;
};

import type { AttachmentMeta } from '../../data/attachment/types';


