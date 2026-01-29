import type { EditQueueRemoteDataSource } from './remote';
import { editQueueRemoteDataSource } from './remote';
import type { EditQueueItem, EditQueueListResponse, UpdateEditQueueItemRequest } from './types';
import { BaseRepository } from '../../base-repository';
import { getSupabaseClient } from '../../../core/services/supabase';
import type { AttachmentMeta } from '../../attachment/types';

type DbAppJobQueueRow = {
  id: string;
  app_id: string;
  kind: string;
  status: EditQueueItem['status'];
  payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  run_after: string | null;
  priority: number;
};

const ACTIVE_STATUSES: EditQueueItem['status'][] = ['pending'];

function toString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function toAttachments(value: unknown): AttachmentMeta[] {
  return Array.isArray(value) ? (value as AttachmentMeta[]) : [];
}

function mapQueueItem(row: DbAppJobQueueRow): EditQueueItem {
  const payload = (row.payload ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    status: row.status,
    prompt: toString(payload.trimmedPrompt),
    messageId: toString(payload.messageId),
    attachments: toAttachments(payload.attachments),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    runAfter: row.run_after,
    priority: row.priority,
  };
}

export interface EditQueueRepository {
  list(appId: string): Promise<EditQueueItem[]>;
  update(appId: string, queueItemId: string, payload: UpdateEditQueueItemRequest): Promise<EditQueueItem>;
  cancel(appId: string, queueItemId: string): Promise<EditQueueItem>;
  subscribeEditQueue(
    appId: string,
    handlers: {
      onInsert?: (item: EditQueueItem) => void;
      onUpdate?: (item: EditQueueItem) => void;
      onDelete?: (item: EditQueueItem) => void;
    }
  ): () => void;
}

class EditQueueRepositoryImpl extends BaseRepository implements EditQueueRepository {
  constructor(private readonly remote: EditQueueRemoteDataSource) {
    super();
  }

  async list(appId: string): Promise<EditQueueItem[]> {
    const res = await this.remote.list(appId);
    const data = this.unwrapOrThrow(res) as EditQueueListResponse;
    return data.items ?? [];
  }

  async update(
    appId: string,
    queueItemId: string,
    payload: UpdateEditQueueItemRequest
  ): Promise<EditQueueItem> {
    const res = await this.remote.update(appId, queueItemId, payload);
    return this.unwrapOrThrow(res);
  }

  async cancel(appId: string, queueItemId: string): Promise<EditQueueItem> {
    const res = await this.remote.cancel(appId, queueItemId);
    return this.unwrapOrThrow(res);
  }

  subscribeEditQueue(
    appId: string,
    handlers: {
      onInsert?: (item: EditQueueItem) => void;
      onUpdate?: (item: EditQueueItem) => void;
      onDelete?: (item: EditQueueItem) => void;
    }
  ): () => void {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`edit-queue:app:${appId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'app_job_queue', filter: `app_id=eq.${appId}` },
        (payload) => {
          const row = payload.new as DbAppJobQueueRow;
          if (row.kind !== 'edit') return;
          const item = mapQueueItem(row);
          if (!ACTIVE_STATUSES.includes(item.status)) return;
          handlers.onInsert?.(item);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_job_queue', filter: `app_id=eq.${appId}` },
        (payload) => {
          const row = payload.new as DbAppJobQueueRow;
          if (row.kind !== 'edit') return;
          const item = mapQueueItem(row);
          if (ACTIVE_STATUSES.includes(item.status)) handlers.onUpdate?.(item);
          else handlers.onDelete?.(item);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'app_job_queue', filter: `app_id=eq.${appId}` },
        (payload) => {
          const row = payload.old as DbAppJobQueueRow;
          if (row.kind !== 'edit') return;
          handlers.onDelete?.(mapQueueItem(row));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const editQueueRepository: EditQueueRepository = new EditQueueRepositoryImpl(
  editQueueRemoteDataSource
);
