import * as React from 'react';

import type { Message } from '../../data/messages/types';
import { messagesRepository } from '../../data/messages/repository';
import type { ChatAttachment, ChatMessage } from '../../components/models/types';
import { useForegroundSignal } from './useForegroundSignal';

export type UseThreadMessagesResult = {
  raw: Message[];
  messages: ChatMessage[];
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  recoverAttachmentUrls: () => void;
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

function parseAttachments(payload: Message['payload']): ChatAttachment[] {
  const raw = (payload as any)?.attachments;
  if (!Array.isArray(raw)) return [];
  const out: ChatAttachment[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const id = typeof (item as any).id === 'string' ? String((item as any).id) : '';
    const name = typeof (item as any).name === 'string' ? String((item as any).name) : '';
    const mimeType = typeof (item as any).mimeType === 'string' ? String((item as any).mimeType) : '';
    const size = typeof (item as any).size === 'number' ? Number((item as any).size) : 0;
    if (!id || !name || !mimeType || !Number.isFinite(size) || size <= 0) continue;
    out.push({
      id,
      name,
      mimeType,
      size,
      uri: typeof (item as any).downloadUrl === 'string' ? String((item as any).downloadUrl) : undefined,
      width: typeof (item as any).width === 'number' ? Number((item as any).width) : undefined,
      height: typeof (item as any).height === 'number' ? Number((item as any).height) : undefined,
    });
  }
  return out;
}

function hasAttachmentWithoutUrl(payload: Message['payload']): boolean {
  const attachments = parseAttachments(payload);
  if (attachments.length === 0) return false;
  return attachments.some((att) => !att.uri);
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
    attachments: parseAttachments(m.payload),
  };
}

export function useThreadMessages(threadId: string): UseThreadMessagesResult {
  const [raw, setRaw] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const activeRequestIdRef = React.useRef(0);
  const foregroundSignal = useForegroundSignal(Boolean(threadId));
  const hasLoadedOnceRef = React.useRef(false);
  const attachmentRecoveryTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAttachmentRecoveryAtRef = React.useRef(0);

  React.useEffect(() => {
    hasLoadedOnceRef.current = false;
  }, [threadId]);

  React.useEffect(() => {
    return () => {
      if (attachmentRecoveryTimerRef.current) {
        clearTimeout(attachmentRecoveryTimerRef.current);
        attachmentRecoveryTimerRef.current = null;
      }
    };
  }, []);

  const upsertSorted = React.useCallback((prev: Message[], m: Message) => {
    const next = prev.filter((x) => x.id !== m.id);
    next.push(m);
    next.sort(compareMessages);
    return next;
  }, []);

  const refetch = React.useCallback(async (opts?: { background?: boolean }) => {
    if (!threadId) {
      setRaw([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    const requestId = ++activeRequestIdRef.current;
    const isBackground = Boolean(opts?.background);
    const useBackgroundRefresh = isBackground && hasLoadedOnceRef.current;
    if (useBackgroundRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const list = await messagesRepository.list(threadId);
      if (activeRequestIdRef.current !== requestId) return;
      hasLoadedOnceRef.current = true;
      setRaw([...list].sort(compareMessages));
    } catch (e) {
      if (activeRequestIdRef.current !== requestId) return;
      setError(e instanceof Error ? e : new Error(String(e)));
      setRaw([]);
    } finally {
      if (activeRequestIdRef.current !== requestId) return;
      if (useBackgroundRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [threadId]);

  const recoverAttachmentUrls = React.useCallback(() => {
    if (!threadId) return;
    if (attachmentRecoveryTimerRef.current) return;

    const now = Date.now();
    if (now - lastAttachmentRecoveryAtRef.current < 2000) return;

    attachmentRecoveryTimerRef.current = setTimeout(() => {
      attachmentRecoveryTimerRef.current = null;
      lastAttachmentRecoveryAtRef.current = Date.now();
      void refetch({ background: true });
    }, 250);
  }, [refetch, threadId]);

  React.useEffect(() => {
    void refetch();
  }, [refetch]);

  React.useEffect(() => {
    if (!threadId) return;
    const unsubscribe = messagesRepository.subscribeThread(threadId, {
      onInsert: (m) => {
        setRaw((prev) => upsertSorted(prev, m));
        if (hasAttachmentWithoutUrl(m.payload)) {
          recoverAttachmentUrls();
        }
      },
      onUpdate: (m) => {
        setRaw((prev) => upsertSorted(prev, m));
        if (hasAttachmentWithoutUrl(m.payload)) {
          recoverAttachmentUrls();
        }
      },
      onDelete: (m) => setRaw((prev) => prev.filter((x) => x.id !== m.id)),
    });
    return unsubscribe;
  }, [threadId, upsertSorted, foregroundSignal, recoverAttachmentUrls]);

  React.useEffect(() => {
    if (!threadId) return;
    if (foregroundSignal <= 0) return;
    void refetch({ background: true });
  }, [foregroundSignal, refetch, threadId]);

  React.useEffect(() => {
    if (!threadId) return;
    if (raw.length === 0) return;
    if (!raw.some((m) => hasAttachmentWithoutUrl(m.payload))) return;
    recoverAttachmentUrls();
  }, [raw, recoverAttachmentUrls, threadId]);

  const messages = React.useMemo(() => {
    const visible = raw.filter((m) => !isQueuedHiddenMessage(m));
    const resolved = visible.length > 0 ? visible : raw;
    return resolved.map(mapMessageToChatMessage);
  }, [raw]);

  return { raw, messages, loading, refreshing, error, refetch, recoverAttachmentUrls };
}


