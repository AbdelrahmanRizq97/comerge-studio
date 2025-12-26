import * as React from 'react';

import type { App } from '../../data/apps/types';
import { appsRepository } from '../../data/apps/repository';
import { agentRepository } from '../../data/agent/repository';
import type { AttachmentMeta } from '../../data/attachment/types';

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

        let attachmentMetas: AttachmentMeta[] | undefined;
        if (attachments && attachments.length > 0 && uploadAttachments) {
          attachmentMetas = await uploadAttachments({ threadId, appId: targetApp.id, dataUrls: attachments });
        }

        await agentRepository.editApp({
          prompt,
          thread_id: threadId,
          app_id: targetApp.id,
          attachments: attachmentMetas && attachmentMetas.length > 0 ? attachmentMetas : undefined,
        });
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        setForking(false);
        setSending(false);
      }
    },
    [app, onForkedApp, sending, shouldForkOnEdit, uploadAttachments, userId]
  );

  return { isOwner, shouldForkOnEdit, forking, sending, error, sendEdit };
}


