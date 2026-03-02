import * as React from 'react';
import { Image } from 'react-native';

import type { ChatMessage } from '../../components/models/types';

export type UseOptimisticChatMessagesParams = {
  threadId: string | null;
  shouldForkOnEdit: boolean;
  disableOptimistic?: boolean;
  chatMessages: ChatMessage[];
  onSendChat: (text: string, attachments?: string[]) => void | Promise<void>;
};

export type UseOptimisticChatMessagesResult = {
  messages: ChatMessage[];
  onSend: (text: string, attachments?: string[]) => Promise<void>;
  onRetry: (messageId: string) => Promise<void>;
  isRetrying: (messageId: string) => boolean;
};

type OptimisticChatMessage = {
  id: string;
  content: string;
  attachments?: OptimisticAttachment[];
  createdAtIso: string;
  baseServerLastId: string | null;
  failed: boolean;
  retrying: boolean;
};

type OptimisticAttachment = {
  uri: string;
  width?: number;
  height?: number;
};

function makeOptimisticId() {
  return `optimistic:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`;
}

function toEpochMs(createdAt: ChatMessage['createdAt']): number {
  if (createdAt == null) return 0;
  if (typeof createdAt === 'number') return createdAt;
  if (createdAt instanceof Date) return createdAt.getTime();
  const t = Date.parse(String(createdAt));
  return Number.isFinite(t) ? t : 0;
}

async function resolveAttachmentDimensions(uris: string[]): Promise<OptimisticAttachment[]> {
  return Promise.all(
    uris.map(
      async (uri): Promise<OptimisticAttachment> => {
        try {
          const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
            Image.getSize(
              uri,
              (w, h) => resolve({ width: w, height: h }),
              (err) => reject(err)
            );
          });
          if (width > 0 && height > 0) {
            return { uri, width: Math.round(width), height: Math.round(height) };
          }
        } catch {}
        return { uri };
      }
    )
  );
}

function isOptimisticResolvedByServer(chatMessages: ChatMessage[], o: OptimisticChatMessage) {
  if (o.failed) return false;

  const normalize = (s: string) => s.trim();

  let startIndex = -1;
  if (o.baseServerLastId) {
    startIndex = chatMessages.findIndex((m) => m.id === o.baseServerLastId);
  }
  const candidates = startIndex >= 0 ? chatMessages.slice(startIndex + 1) : chatMessages;

  const target = normalize(o.content);
  for (const m of candidates) {
    if (m.author !== 'human') continue;
    if (normalize(m.content) !== target) continue;

    const serverMs = toEpochMs(m.createdAt);
    const optimisticMs = Date.parse(o.createdAtIso);
    if (Number.isFinite(optimisticMs) && optimisticMs > 0 && serverMs > 0) {
      if (serverMs + 120_000 < optimisticMs) continue;
    }
    return true;
  }
  return false;
}

export function useOptimisticChatMessages({
  threadId,
  shouldForkOnEdit: _shouldForkOnEdit,
  disableOptimistic = false,
  chatMessages,
  onSendChat,
}: UseOptimisticChatMessagesParams): UseOptimisticChatMessagesResult {
  const [optimisticChat, setOptimisticChat] = React.useState<OptimisticChatMessage[]>([]);

  React.useEffect(() => {
    setOptimisticChat([]);
  }, [threadId]);

  const messages = React.useMemo(() => {
    if (!optimisticChat || optimisticChat.length === 0) return chatMessages;

    const unresolved = optimisticChat.filter((o) => !isOptimisticResolvedByServer(chatMessages, o));
    if (unresolved.length === 0) return chatMessages;

    const optimisticAsChat = unresolved.map<ChatMessage>((o) => ({
      id: o.id,
      author: 'human',
      content: o.content,
      createdAt: o.createdAtIso,
      kind: 'optimistic',
      attachments: (o.attachments ?? []).map((attachment, index) => ({
        id: `${o.id}:attachment:${index}`,
        name: `attachment-${index + 1}.png`,
        mimeType: 'image/png',
        size: 1,
        uri: attachment.uri,
        width: attachment.width,
        height: attachment.height,
      })),
      meta: o.failed
        ? { kind: 'optimistic', event: 'send.failed', status: 'error' }
        : { kind: 'optimistic', event: 'send.pending', status: 'info' },
    }));

    const merged = [...chatMessages, ...optimisticAsChat];
    merged.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    return merged;
  }, [chatMessages, optimisticChat]);

  React.useEffect(() => {
    if (optimisticChat.length === 0) return;
    setOptimisticChat((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.filter((o) => !isOptimisticResolvedByServer(chatMessages, o) || o.failed);
      return next.length === prev.length ? prev : next;
    });
  }, [chatMessages, optimisticChat.length]);

  const onSend = React.useCallback(
    async (text: string, attachments?: string[]) => {
      if (disableOptimistic) {
        await onSendChat(text, attachments);
        return;
      }

      const createdAtIso = new Date().toISOString();
      const baseServerLastId = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1]!.id : null;
      const id = makeOptimisticId();
      const normalizedAttachments =
        attachments && attachments.length > 0
          ? await resolveAttachmentDimensions(attachments)
          : undefined;

      setOptimisticChat((prev) => [
        ...prev,
        {
          id,
          content: text,
          attachments: normalizedAttachments,
          createdAtIso,
          baseServerLastId,
          failed: false,
          retrying: false,
        },
      ]);

      void Promise.resolve(onSendChat(text, attachments)).catch(() => {
        setOptimisticChat((prev) => prev.map((m) => (m.id === id ? { ...m, failed: true } : m)));
      });
    },
    [chatMessages, disableOptimistic, onSendChat]
  );

  const onRetry = React.useCallback(
    async (messageId: string) => {
      if (disableOptimistic) return;
      const target = optimisticChat.find((m) => m.id === messageId);
      if (!target || target.retrying) return;

      const baseServerLastId = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1]!.id : null;
      setOptimisticChat((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, failed: false, retrying: true, baseServerLastId }
            : m
        )
      );

      try {
        await onSendChat(
          target.content,
          target.attachments?.map((att) => att.uri)
        );
        setOptimisticChat((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, retrying: false } : m))
        );
      } catch {
        setOptimisticChat((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, failed: true, retrying: false } : m))
        );
      }
    },
    [chatMessages, disableOptimistic, onSendChat, optimisticChat]
  );

  const isRetrying = React.useCallback(
    (messageId: string) => {
      return optimisticChat.some((m) => m.id === messageId && m.retrying);
    },
    [optimisticChat]
  );

  return { messages, onSend, onRetry, isRetrying };
}

