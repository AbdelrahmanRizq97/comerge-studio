export type UserSummary = {
  id: string;
  name?: string | null;
  avatarUri?: string | null;
};

export type MergeRequestStatus = 'open' | 'approved' | 'rejected' | 'merged';

export type MergeRequestSummary = {
  id: string;
  title?: string | null;
  description?: string | null;
  status: MergeRequestStatus;
  creator?: UserSummary | null;
  createdAt?: string | number | Date | null;
  updatedAt?: string | number | Date | null;
};

export type ChatAuthor = 'human' | 'assistant';

export type ChatMessageMetaStatus = 'success' | 'error' | 'info' | 'warning';

export type ChatMessageMeta = {
  kind?: string;
  event?: string;
  status?: ChatMessageMetaStatus;
  mergeRequestId?: string;
  sourceAppId?: string;
  targetAppId?: string;
  appId?: string;
  threadId?: string;
};

export type ChatMessage = {
  id: string;
  author: ChatAuthor;
  content: string;
  createdAt?: string | number | Date | null;
  kind?: string | null;
  meta?: ChatMessageMeta | null;
};


