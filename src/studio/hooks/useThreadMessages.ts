import * as React from 'react';

import type { Message } from '../../data/messages/types';
import { messagesRepository } from '../../data/messages/repository';
import type { ChatMessage } from '../../components/models/types';

export type UseThreadMessagesResult = {
  raw: Message[];
  messages: ChatMessage[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

function extractMeta(payload: unknown): ChatMessage['meta'] {
  const meta = (payload as any)?.meta;
  if (!meta || typeof meta !== 'object') return null;
  const obj = meta as Record<string, unknown>;
  return {
    kind: typeof obj.kind === 'string' ? obj.kind : undefined,
    event: typeof obj.event === 'string' ? obj.event : undefined,
    status: typeof obj.status === 'string' ? (obj.status as any) : undefined,
    mergeRequestId: typeof obj.mergeRequestId === 'string' ? obj.mergeRequestId : undefined,
    sourceAppId: typeof obj.sourceAppId === 'string' ? obj.sourceAppId : undefined,
    targetAppId: typeof obj.targetAppId === 'string' ? obj.targetAppId : undefined,
    appId: typeof obj.appId === 'string' ? obj.appId : undefined,
    threadId: typeof obj.threadId === 'string' ? obj.threadId : undefined,
  };
}

function mapMessageToChatMessage(m: Message): ChatMessage {
  const kind = typeof (m.payload as any)?.type === 'string' ? String((m.payload as any).type) : null;
  return {
    id: m.id,
    author: m.authorType === 'ai' ? 'assistant' : 'human',
    content: typeof m.payload?.content === 'string' ? m.payload.content : '',
    createdAt: m.createdAt,
    kind,
    meta: extractMeta(m.payload),
  };
}

export function useThreadMessages(threadId: string): UseThreadMessagesResult {
  const [raw, setRaw] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const refetch = React.useCallback(async () => {
    if (!threadId) {
      setRaw([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await messagesRepository.list(threadId);
      setRaw(list);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setRaw([]);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  React.useEffect(() => {
    void refetch();
  }, [refetch]);

  React.useEffect(() => {
    if (!threadId) return;
    const unsubscribe = messagesRepository.subscribeThread(threadId, {
      onInsert: (m) => setRaw((prev) => [...prev, m]),
      onUpdate: (m) => setRaw((prev) => prev.map((x) => (x.id === m.id ? m : x))),
      onDelete: (m) => setRaw((prev) => prev.filter((x) => x.id !== m.id)),
    });
    return unsubscribe;
  }, [threadId]);

  const messages = React.useMemo(() => raw.map(mapMessageToChatMessage), [raw]);

  return { raw, messages, loading, error, refetch };
}


