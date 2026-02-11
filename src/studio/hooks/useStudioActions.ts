import * as React from 'react';

import type { App } from '../../data/apps/types';
import { appsRepository } from '../../data/apps/repository';
import { agentRepository } from '../../data/agent/repository';
import type { AttachmentMeta } from '../../data/attachment/types';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableNetworkError(e: unknown): boolean {
  const err = e as any;
  const code = typeof err?.code === 'string' ? err.code : '';
  const message = typeof err?.message === 'string' ? err.message : '';

  if (code === 'ERR_NETWORK' || code === 'ECONNABORTED') return true;
  if (message.toLowerCase().includes('network error')) return true;
  if (message.toLowerCase().includes('timeout')) return true;

  const status = typeof err?.response?.status === 'number' ? err.response.status : undefined;
  if (status && (status === 429 || status >= 500)) return true;

  return false;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { attempts: number; baseDelayMs: number; maxDelayMs: number }
): Promise<T> {
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= opts.attempts; attempt += 1) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const retryable = isRetryableNetworkError(e);
      if (!retryable || attempt >= opts.attempts) {
        throw e;
      }
      const exp = Math.min(opts.maxDelayMs, opts.baseDelayMs * Math.pow(2, attempt - 1));
      const jitter = Math.floor(Math.random() * 250);
      await sleep(exp + jitter);
    }
  }
  throw lastErr;
}

function generateIdempotencyKey(): string {
  const rnd = globalThis.crypto?.randomUUID?.();
  if (rnd) return `edit:${rnd}`;
  return `edit:${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export type UseStudioActionsParams = {
  userId: string | null;
  /**
   * Current app object for the active appId.
   */
  app: App | null;
  /**
   * Called when we fork and should switch to the new app.
   */
  onForkedApp?: (appId: string, opts?: { keepRenderingAppId?: string }) => void;
  onEditStart?: () => void;
  onEditQueued?: (info: { queueItemId?: string | null; queuePosition?: number | null }) => void;
  onEditFinished?: () => void;
  /**
   * Upload function used to convert attachments.
   */
  uploadAttachments?: (params: { threadId: string; appId: string; dataUrls: string[] }) => Promise<AttachmentMeta[]>;
};

export type UseStudioActionsResult = {
  isOwner: boolean;
  shouldForkOnEdit: boolean;
  forking: boolean;
  sending: boolean;
  error: Error | null;
  sendEdit: (params: { prompt: string; attachments?: string[] }) => Promise<void>;
};

export function useStudioActions({
  userId,
  app,
  onForkedApp,
  onEditStart,
  onEditQueued,
  onEditFinished,
  uploadAttachments,
}: UseStudioActionsParams): UseStudioActionsResult {
  const [forking, setForking] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const isOwner = Boolean(userId && app?.createdBy && userId === app.createdBy);
  const shouldForkOnEdit = Boolean(userId && app && app.createdBy !== userId);

  const sendEdit = React.useCallback(
    async ({ prompt, attachments }: { prompt: string; attachments?: string[] }) => {
      if (!userId || !app) return;
      if (!prompt.trim()) return;
      if (sending) return;

      setSending(true);
      setError(null);
      try {
        let targetApp = app;

        if (shouldForkOnEdit) {
          setForking(true);
          const sourceAppId = app.id;
          const forked = await appsRepository.fork(app.id, {});
          targetApp = forked;
          // For fork+edit, keep rendering the original app until the edit completes on the fork.
          onForkedApp?.(forked.id, { keepRenderingAppId: sourceAppId });
        }
        setForking(false);

        const threadId = targetApp.threadId;
        if (!threadId) throw new Error('No thread available for this app.');
        onEditStart?.();

        let attachmentMetas: AttachmentMeta[] | undefined;
        if (attachments && attachments.length > 0 && uploadAttachments) {
          attachmentMetas = await uploadAttachments({ threadId, appId: targetApp.id, dataUrls: attachments });
        }

        const idempotencyKey = generateIdempotencyKey();
        const editResult = await withRetry(
          async () => {
            return await agentRepository.editApp({
              prompt,
              thread_id: threadId,
              app_id: targetApp.id,
              attachments: attachmentMetas && attachmentMetas.length > 0 ? attachmentMetas : undefined,
              idempotencyKey,
            });
          },
          { attempts: 3, baseDelayMs: 500, maxDelayMs: 4000 }
        );
        onEditQueued?.({
          queueItemId: editResult.queueItemId ?? null,
          queuePosition: editResult.queuePosition ?? null,
        });
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        setForking(false);
        setSending(false);
        onEditFinished?.();
      }
    },
    [app, onEditFinished, onEditQueued, onEditStart, onForkedApp, sending, shouldForkOnEdit, uploadAttachments, userId]
  );

  return { isOwner, shouldForkOnEdit, forking, sending, error, sendEdit };
}


