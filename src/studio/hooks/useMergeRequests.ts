import * as React from 'react';

import type { MergeRequest, MergeRequestStatus } from '../../data/merge-requests/types';
import { mergeRequestsRepository } from '../../data/merge-requests/repository';
import type { MergeRequestSummary } from '../../components/models/types';
import { usersRepository } from '../../data/users/repository';
import type { UserStats } from '../../data/users/types';
import {
  trackApproveMergeRequest,
  trackOpenMergeRequest,
  trackRejectMergeRequest,
} from '../analytics/track';

export type MergeRequestLists = {
  /**
   * Merge requests targeting the current app (for owners/reviewers).
   */
  incoming: MergeRequest[];
  /**
   * Merge requests created from the current app (for contributors).
   */
  outgoing: MergeRequest[];
};

export type MergeRequestActions = {
  refresh: () => Promise<void>;
  openMergeRequest: (sourceAppId: string) => Promise<MergeRequest>;
  approve: (mrId: string) => Promise<MergeRequest>;
  reject: (mrId: string) => Promise<MergeRequest>;
};

export type UseMergeRequestsResult = {
  loading: boolean;
  error: Error | null;
  lists: MergeRequestLists;
  actions: MergeRequestActions;
  toSummary: (mr: MergeRequest) => MergeRequestSummary;
  byId: Record<string, MergeRequest>;
  creatorStatsById: Record<string, UserStats>;
};

const incomingStatuses: MergeRequestStatus[] = ['open', 'approved'];
const outgoingStatuses: MergeRequestStatus[] = ['open', 'approved', 'rejected', 'merged', 'closed'];

function toUiStatus(status: MergeRequestStatus): MergeRequestSummary['status'] {
  switch (status) {
    case 'open':
    case 'approved':
    case 'rejected':
    case 'merged':
      return status;
    case 'closed':
    default:
      return 'rejected';
  }
}

export function useMergeRequests(params: { appId: string }): UseMergeRequestsResult {
  const { appId } = params;
  const [incoming, setIncoming] = React.useState<MergeRequest[]>([]);
  const [outgoing, setOutgoing] = React.useState<MergeRequest[]>([]);
  const [loading, setLoading] = React.useState(() => Boolean(appId));
  const [error, setError] = React.useState<Error | null>(null);
  const [creatorStatsById, setCreatorStatsById] = React.useState<Record<string, UserStats>>({});

  React.useEffect(() => {
    setLoading(Boolean(appId));
  }, [appId]);

  const pollUntilMerged = React.useCallback(async (mrId: string) => {
    const startedAt = Date.now();
    const timeoutMs = 2 * 60 * 1000;
    for (;;) {
      const mr = await mergeRequestsRepository.getById(mrId);
      if (mr.status === 'merged') return mr;
      if (Date.now() - startedAt > timeoutMs) return mr;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }, []);

  const refresh = React.useCallback(async () => {
    if (!appId) {
      setIncoming([]);
      setOutgoing([]);
      setCreatorStatsById({});
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [inc, out] = await Promise.all([
        mergeRequestsRepository.listByStatuses({ targetAppId: appId, statuses: incomingStatuses }).then((x) => {
          return (Object.values(x).flat() as MergeRequest[]).filter(Boolean);
        }),
        mergeRequestsRepository.listByStatuses({ sourceAppId: appId, statuses: outgoingStatuses }).then((x) => {
          return (Object.values(x).flat() as MergeRequest[]).filter(Boolean);
        }),
      ]);
      setIncoming(inc);
      setOutgoing(out);

      const ids = Array.from(new Set([...inc, ...out].map((m) => m.createdBy).filter(Boolean)));
      if (ids.length === 0) {
        setCreatorStatsById({});
      } else {
        try {
          const map = await usersRepository.getStatsBatch(ids);
          setCreatorStatsById(map);
        } catch {
          // Keep whatever we already have.
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setIncoming([]);
      setOutgoing([]);
      setCreatorStatsById({});
    } finally {
      setLoading(false);
    }
  }, [appId]);

  React.useEffect(() => {
    void refresh();
  }, [appId, refresh]);

  const openMergeRequest = React.useCallback(async (sourceAppId: string) => {
    try {
      const mr = await mergeRequestsRepository.open({ sourceAppId });
      await refresh();
      await trackOpenMergeRequest({
        appId,
        mergeRequestId: mr.id,
        success: true,
      });
      return mr;
    } catch (error) {
      await trackOpenMergeRequest({
        appId,
        success: false,
        error,
      });
      throw error;
    }
  }, [refresh]);

  const approve = React.useCallback(async (mrId: string) => {
    try {
      const mr = await mergeRequestsRepository.update(mrId, { status: 'approved' });
      await refresh();
      const merged = await pollUntilMerged(mrId);
      await refresh();
      await trackApproveMergeRequest({
        appId,
        mergeRequestId: mrId,
        success: true,
      });
      return merged ?? mr;
    } catch (error) {
      await trackApproveMergeRequest({
        appId,
        mergeRequestId: mrId,
        success: false,
        error,
      });
      throw error;
    }
  }, [appId, pollUntilMerged, refresh]);

  const reject = React.useCallback(async (mrId: string) => {
    try {
      const mr = await mergeRequestsRepository.update(mrId, { status: 'rejected' });
      await refresh();
      await trackRejectMergeRequest({
        appId,
        mergeRequestId: mrId,
        success: true,
      });
      return mr;
    } catch (error) {
      await trackRejectMergeRequest({
        appId,
        mergeRequestId: mrId,
        success: false,
        error,
      });
      throw error;
    }
  }, [appId, refresh]);

  const toSummary = React.useCallback((mr: MergeRequest): MergeRequestSummary => {
    const stats = creatorStatsById[mr.createdBy];
    return {
      id: mr.id,
      title: mr.title ?? undefined,
      description: mr.description ?? undefined,
      status: toUiStatus(mr.status),
      creator: {
        id: mr.createdBy,
        name: stats?.name ?? undefined,
        avatarUri: stats?.avatar ?? undefined,
      },
      createdAt: mr.createdAt,
      updatedAt: mr.updatedAt,
    };
  }, [creatorStatsById]);

  const byId = React.useMemo(() => {
    const all = [...incoming, ...outgoing];
    const map: Record<string, MergeRequest> = {};
    for (const mr of all) map[mr.id] = mr;
    return map;
  }, [incoming, outgoing]);

  return {
    loading,
    error,
    lists: { incoming, outgoing },
    actions: { refresh, openMergeRequest, approve, reject },
    toSummary,
    byId,
    creatorStatsById,
  };
}


