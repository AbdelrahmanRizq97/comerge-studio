import type { MessagesRemoteDataSource } from './remote';
import { messagesRemoteDataSource } from './remote';
import type { Message } from './types';
import { BaseRepository } from '../../data/base-repository';
import { subscribeManagedChannel } from '../../core/services/supabase/realtimeManager';

type DbMessageRow = {
  id: string;
  app_id: string;
  thread_id: string;
  commit_id: string | null;
  parent_message_id: string | null;
  author_type: 'human' | 'ai' | 'system';
  user_id: string | null;
  payload: Record<string, unknown>;
  reference_id: string | null;
  created_at: string;
  updated_at: string;
};

function mapDbRowToMessage(row: DbMessageRow): Message {
  return {
    id: row.id,
    appId: row.app_id,
    threadId: row.thread_id,
    commitId: row.commit_id,
    parentMessageId: row.parent_message_id,
    authorType: row.author_type === 'system' ? 'ai' : row.author_type,
    userId: row.user_id,
    payload: row.payload,
    referenceId: row.reference_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface MessagesRepository {
  list(threadId: string): Promise<Message[]>;
  subscribeThread(
    threadId: string,
    handlers: {
      onInsert?: (m: Message) => void;
      onUpdate?: (m: Message) => void;
      onDelete?: (m: Message) => void;
    }
  ): () => void;
}

class MessagesRepositoryImpl extends BaseRepository implements MessagesRepository {
  constructor(private readonly remote: MessagesRemoteDataSource) {
    super();
  }

  async list(threadId: string): Promise<Message[]> {
    const res = await this.remote.list(threadId);
    return this.unwrapOrThrow(res);
  }

  subscribeThread(
    threadId: string,
    handlers: {
      onInsert?: (m: Message) => void;
      onUpdate?: (m: Message) => void;
      onDelete?: (m: Message) => void;
    }
  ): () => void {
    return subscribeManagedChannel(`messages:thread:${threadId}`, (channel) => {
      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'message', filter: `thread_id=eq.${threadId}` },
          (payload) => {
            const row = payload.new as DbMessageRow;
            handlers.onInsert?.(mapDbRowToMessage(row));
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'message', filter: `thread_id=eq.${threadId}` },
          (payload) => {
            const row = payload.new as DbMessageRow;
            handlers.onUpdate?.(mapDbRowToMessage(row));
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'message', filter: `thread_id=eq.${threadId}` },
          (payload) => {
            const row = payload.old as DbMessageRow;
            handlers.onDelete?.(mapDbRowToMessage(row));
          }
        );
    });
  }
}

export const messagesRepository: MessagesRepository = new MessagesRepositoryImpl(messagesRemoteDataSource);


