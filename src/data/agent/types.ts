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
  idempotencyKey?: string;
};

export type ForkEditStartRequest = {
  source_app_id: string;
  prompt: string;
  attachmentTokens?: string[];
  idempotencyKey?: string;
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
  queuePosition?: number | null;
};

export type AgentForkEditStartResult = {
  runId: string;
  targetAppId: string;
  targetThreadId: string;
  messageId: string | null;
  queueItemId: string | null;
  queuePosition: number | null;
};

import type { AttachmentMeta } from '../../data/attachment/types';

