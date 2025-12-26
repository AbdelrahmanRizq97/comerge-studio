import * as React from 'react';

import { appCommentsRepository } from '../../data/comments/repository';
import type { AppComment } from '../../data/comments/types';

export type UseAppCommentsResult = {
  comments: AppComment[];
  loading: boolean;
  sending: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  create: (text: string) => Promise<void>;
};

export function useAppComments(appId: string | null): UseAppCommentsResult {
  const [comments, setComments] = React.useState<AppComment[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const sortByCreatedAtAsc = React.useCallback((items: AppComment[]) => {
    return [...items].sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return at - bt;
    });
  }, []);

  const refresh = React.useCallback(async () => {
    if (!appId) {
      setComments([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await appCommentsRepository.list(appId, { page: 1, pageSize: 50, includeDeleted: false });
      setComments(sortByCreatedAtAsc(res.items));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [appId, sortByCreatedAtAsc]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = React.useCallback(
    async (text: string) => {
      if (!appId) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      setSending(true);
      setError(null);
      try {
        const newComment = await appCommentsRepository.create(appId, { body: trimmed, commentType: 'general' });
        setComments((prev) => sortByCreatedAtAsc([...prev, newComment]));
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        throw e;
      } finally {
        setSending(false);
      }
    },
    [appId, sortByCreatedAtAsc]
  );

  return { comments, loading, sending, error, refresh, create };
}


