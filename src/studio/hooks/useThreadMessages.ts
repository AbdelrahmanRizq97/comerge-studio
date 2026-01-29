import * as React from 'react';

import type { Message } from '../../data/messages/types';
import { messagesRepository } from '../../data/messages/repository';
import type { ChatMessage } from '../../components/models/types';
import { useForegroundSignal } from './useForegroundSignal';

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

function getPayloadMeta(payload: Message['payload']): Record<string, unknown> | null {
  const meta = (payload as any)?.meta;
  if (!meta || typeof meta !== 'object') return null;
  return meta as Record<string, unknown>;
}

function isQueuedHiddenMessage(m: Message): boolean {
  if (m.authorType !== 'human') return false;
  const meta = getPayloadMeta(m.payload);
  return meta?.visibility === 'queued';
}

function toEpochMs(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getEffectiveSortMs(m: Message): number {
  const meta = getPayloadMeta(m.payload);
  const runStartedAt = meta?.runStartedAt;
  const runMs = toEpochMs(runStartedAt);
  return runMs > 0 ? runMs : toEpochMs(m.createdAt);
}

function compareMessages(a: Message, b: Message): number {
  const aMs = getEffectiveSortMs(a);
  const bMs = getEffectiveSortMs(b);
  if (aMs !== bMs) return aMs - bMs;
  return String(a.createdAt).localeCompare(String(b.createdAt));
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
  const activeRequestIdRef = React.useRef(0);
  const foregroundSignal = useForegroundSignal(Boolean(threadId));

  const upsertSorted = React.useCallback((prev: Message[], m: Message) => {
    const include = !isQueuedHiddenMessage(m);
    const next = prev.filter((x) => x.id !== m.id);
    if (include) next.push(m);
    next.sort(compareMessages);
    return next;
  }, []);

  const refetch = React.useCallback(async () => {
    if (!threadId) {
      setRaw([]);
      return;
    }
    const requestId = ++activeRequestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const list = await messagesRepository.list(threadId);
      if (activeRequestIdRef.current !== requestId) return;
      setRaw([...list].filter((m) => !isQueuedHiddenMessage(m)).sort(compareMessages));
    } catch (e) {
      if (activeRequestIdRef.current !== requestId) return;
      setError(e instanceof Error ? e : new Error(String(e)));
      setRaw([]);
    } finally {
      if (activeRequestIdRef.current === requestId) setLoading(false);
    }
  }, [threadId]);

  React.useEffect(() => {
    void refetch();
  }, [refetch]);

  React.useEffect(() => {
    if (!threadId) return;
    const unsubscribe = messagesRepository.subscribeThread(threadId, {
      onInsert: (m) => setRaw((prev) => upsertSorted(prev, m)),
      onUpdate: (m) => setRaw((prev) => upsertSorted(prev, m)),
      onDelete: (m) => setRaw((prev) => prev.filter((x) => x.id !== m.id)),
    });
    return unsubscribe;
  }, [threadId, upsertSorted, foregroundSignal]);

  React.useEffect(() => {
    if (!threadId) return;
    if (foregroundSignal <= 0) return;
    void refetch();
  }, [foregroundSignal, refetch, threadId]);

  const messages = React.useMemo(() => raw.map(mapMessageToChatMessage), [raw]);

  return { raw, messages, loading, error, refetch };
}


