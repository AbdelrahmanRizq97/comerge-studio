export type ThreadKind = 'chat' | 'review' | 'build' | 'system';

export type Thread = {
  id: string;
  createdBy: string;
  title: string | null;
  kind: ThreadKind;
  isLocked: boolean;
  isArchived: boolean;
  metadata: Record<string, unknown> | null;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateThreadRequest = {
  title?: string;
  kind?: ThreadKind;
  isLocked?: boolean;
  isArchived?: boolean;
  metadata?: Record<string, unknown>;
};


