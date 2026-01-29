import * as React from 'react';

import type { EditQueueItem } from '../../data/apps/edit-queue/types';
import { editQueueRepository } from '../../data/apps/edit-queue/repository';
import { useForegroundSignal } from './useForegroundSignal';

export type UseEditQueueResult = {
  items: EditQueueItem[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useEditQueue(appId: string): UseEditQueueResult {
  const [items, setItems] = React.useState<EditQueueItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const activeRequestIdRef = React.useRef(0);
  const foregroundSignal = useForegroundSignal(Boolean(appId));

  const upsertSorted = React.useCallback((prev: EditQueueItem[], nextItem: EditQueueItem) => {
    const next = prev.some((x) => x.id === nextItem.id)
      ? prev.map((x) => (x.id === nextItem.id ? nextItem : x))
      : [...prev, nextItem];
    next.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    return next;
  }, []);

  const refetch = React.useCallback(async () => {
    if (!appId) {
      setItems([]);
      return;
    }
    const requestId = ++activeRequestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const list = await editQueueRepository.list(appId);
      if (activeRequestIdRef.current !== requestId) return;
      setItems([...list].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))));
    } catch (e) {
      if (activeRequestIdRef.current !== requestId) return;
      setError(e instanceof Error ? e : new Error(String(e)));
      setItems([]);
    } finally {
      if (activeRequestIdRef.current === requestId) setLoading(false);
    }
  }, [appId]);

  React.useEffect(() => {
    void refetch();
  }, [refetch]);

  React.useEffect(() => {
    if (!appId) return;
    const unsubscribe = editQueueRepository.subscribeEditQueue(appId, {
      onInsert: (item) => setItems((prev) => upsertSorted(prev, item)),
      onUpdate: (item) => setItems((prev) => upsertSorted(prev, item)),
      onDelete: (item) => setItems((prev) => prev.filter((x) => x.id !== item.id)),
    });
    return unsubscribe;
  }, [appId, upsertSorted, foregroundSignal]);

  React.useEffect(() => {
    if (!appId) return;
    if (foregroundSignal <= 0) return;
    void refetch();
  }, [appId, foregroundSignal, refetch]);

  return { items, loading, error, refetch };
}
