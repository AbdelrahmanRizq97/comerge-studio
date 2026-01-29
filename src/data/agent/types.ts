export type CreateAgentAppRequest = {
  prompt: string;
  thread_id: string;
  app_id?: string;
  attachments?: AttachmentMeta[];
};

export type EditAgentAppRequest = {
  prompt: string;
  thread_id: string;
  app_id: string;
  attachments?: AttachmentMeta[];
};

export type AgentCreateAppResult = {
  threadId: string;
  projectId: string;
  appId: string;
};

export type AgentEditAppResult = {
  threadId: string;
  appId: string;
  queueItemId?: string | null;
};

import type { AttachmentMeta } from '../../data/attachment/types';

