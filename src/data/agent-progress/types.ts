export type AgentRunStatus = 'running' | 'succeeded' | 'failed' | 'cancelled';

export type AgentProgressPhase =
  | 'planning'
  | 'reasoning'
  | 'analyzing'
  | 'editing'
  | 'executing'
  | 'working'
  | 'validating'
  | 'finalizing';

export type AgentRunEventType =
  | 'run_started'
  | 'phase_changed'
  | 'step_started'
  | 'file_changed'
  | 'todo_updated'
  | 'run_completed'
  | 'run_failed'
  | 'run_cancelled';

export type AgentRun = {
  id: string;
  appId: string;
  threadId: string;
  queueItemId: string | null;
  status: AgentRunStatus;
  currentPhase: AgentProgressPhase | null;
  lastSeq: number;
  summary: Record<string, unknown>;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AgentRunEvent = {
  id: string;
  runId: string;
  appId: string;
  threadId: string;
  queueItemId: string | null;
  seq: number;
  eventType: AgentRunEventType;
  phase: AgentProgressPhase | null;
  toolName: string | null;
  path: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type AgentTodoSummary = {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  currentTask: string | null;
};

export type AgentProgressSnapshot = {
  run: AgentRun | null;
  events: AgentRunEvent[];
};

