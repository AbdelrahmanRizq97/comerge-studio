import { getSupabaseClient } from '../../core/services/supabase';
import { subscribeManagedChannel } from '../../core/services/supabase/realtimeManager';
import type { AgentRun, AgentRunEvent } from './types';

type DbAgentRunRow = {
  id: string;
  app_id: string;
  thread_id: string;
  queue_item_id: string | null;
  status: AgentRun['status'];
  current_phase: AgentRun['currentPhase'];
  last_seq: number;
  summary: Record<string, unknown> | null;
  error_code: string | null;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

type DbAgentRunEventRow = {
  id: string;
  run_id: string;
  app_id: string;
  thread_id: string;
  queue_item_id: string | null;
  seq: number;
  event_type: AgentRunEvent['eventType'];
  phase: AgentRunEvent['phase'];
  tool_name: string | null;
  path: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

function mapRun(row: DbAgentRunRow): AgentRun {
  return {
    id: row.id,
    appId: row.app_id,
    threadId: row.thread_id,
    queueItemId: row.queue_item_id,
    status: row.status,
    currentPhase: row.current_phase,
    lastSeq: Number(row.last_seq || 0),
    summary: (row.summary || {}) as Record<string, unknown>,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEvent(row: DbAgentRunEventRow): AgentRunEvent {
  return {
    id: row.id,
    runId: row.run_id,
    appId: row.app_id,
    threadId: row.thread_id,
    queueItemId: row.queue_item_id,
    seq: Number(row.seq || 0),
    eventType: row.event_type,
    phase: row.phase,
    toolName: row.tool_name,
    path: row.path,
    payload: (row.payload || {}) as Record<string, unknown>,
    createdAt: row.created_at,
  };
}

export interface AgentProgressRepository {
  getLatestRun(threadId: string): Promise<AgentRun | null>;
  listEvents(runId: string, afterSeq?: number): Promise<AgentRunEvent[]>;
  subscribeThreadRuns(
    threadId: string,
    handlers: {
      onInsert?: (run: AgentRun) => void;
      onUpdate?: (run: AgentRun) => void;
    }
  ): () => void;
  subscribeRunEvents(
    runId: string,
    handlers: {
      onInsert?: (event: AgentRunEvent) => void;
      onUpdate?: (event: AgentRunEvent) => void;
    }
  ): () => void;
}

class AgentProgressRepositoryImpl implements AgentProgressRepository {
  async getLatestRun(threadId: string): Promise<AgentRun | null> {
    if (!threadId) return null;
    const supabase = getSupabaseClient();
    const { data, error } = await (supabase as any)
      .from('agent_run')
      .select('*')
      .eq('thread_id', threadId)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message || 'Failed to fetch latest agent run');
    if (!data) return null;
    return mapRun(data as DbAgentRunRow);
  }

  async listEvents(runId: string, afterSeq?: number): Promise<AgentRunEvent[]> {
    if (!runId) return [];
    const supabase = getSupabaseClient();
    let query = (supabase as any).from('agent_run_event').select('*').eq('run_id', runId).order('seq', { ascending: true });
    if (typeof afterSeq === 'number' && Number.isFinite(afterSeq) && afterSeq > 0) {
      query = query.gt('seq', afterSeq);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message || 'Failed to fetch agent run events');
    const rows = Array.isArray(data) ? (data as DbAgentRunEventRow[]) : [];
    return rows.map(mapEvent);
  }

  subscribeThreadRuns(
    threadId: string,
    handlers: {
      onInsert?: (run: AgentRun) => void;
      onUpdate?: (run: AgentRun) => void;
    }
  ): () => void {
    return subscribeManagedChannel(`agent-progress:runs:thread:${threadId}`, (channel) => {
      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'agent_run', filter: `thread_id=eq.${threadId}` },
          (payload) => {
            const row = payload.new as DbAgentRunRow;
            handlers.onInsert?.(mapRun(row));
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'agent_run', filter: `thread_id=eq.${threadId}` },
          (payload) => {
            const row = payload.new as DbAgentRunRow;
            handlers.onUpdate?.(mapRun(row));
          }
        );
    });
  }

  subscribeRunEvents(
    runId: string,
    handlers: {
      onInsert?: (event: AgentRunEvent) => void;
      onUpdate?: (event: AgentRunEvent) => void;
    }
  ): () => void {
    return subscribeManagedChannel(`agent-progress:events:run:${runId}`, (channel) => {
      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'agent_run_event', filter: `run_id=eq.${runId}` },
          (payload) => {
            const row = payload.new as DbAgentRunEventRow;
            handlers.onInsert?.(mapEvent(row));
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'agent_run_event', filter: `run_id=eq.${runId}` },
          (payload) => {
            const row = payload.new as DbAgentRunEventRow;
            handlers.onUpdate?.(mapEvent(row));
          }
        );
    });
  }
}

export const agentProgressRepository: AgentProgressRepository = new AgentProgressRepositoryImpl();

