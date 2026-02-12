import * as React from 'react';

import { agentProgressRepository } from '../../data/agent-progress/repository';
import type { AgentProgressPhase, AgentRun, AgentRunEvent, AgentTodoSummary } from '../../data/agent-progress/types';
import { useForegroundSignal } from './useForegroundSignal';

type BundleStage = 'queued' | 'building' | 'fixing' | 'retrying' | 'finalizing' | 'ready' | 'failed';

export type AgentBundleProgressView = {
  active: boolean;
  status: 'loading' | 'succeeded' | 'failed';
  phaseLabel: string;
  progressValue: number;
  errorMessage: string | null;
  platform: 'ios' | 'android' | 'both';
};

export type AgentRunProgressView = {
  runId: string | null;
  status: AgentRun['status'] | null;
  phase: AgentProgressPhase | null;
  latestMessage: string | null;
  changedFilesCount: number;
  recentFiles: string[];
  todoSummary: AgentTodoSummary | null;
  bundle: AgentBundleProgressView | null;
  events: AgentRunEvent[];
};

export type UseAgentRunProgressResult = {
  run: AgentRun | null;
  view: AgentRunProgressView;
  loading: boolean;
  error: Error | null;
  hasLiveProgress: boolean;
  refetch: () => Promise<void>;
};

function upsertBySeq(prev: AgentRunEvent[], next: AgentRunEvent): AgentRunEvent[] {
  const map = new Map<number, AgentRunEvent>();
  for (const item of prev) map.set(item.seq, item);
  map.set(next.seq, next);
  return Array.from(map.values()).sort((a, b) => a.seq - b.seq);
}

function mergeMany(prev: AgentRunEvent[], incoming: AgentRunEvent[]): AgentRunEvent[] {
  if (incoming.length === 0) return prev;
  const map = new Map<number, AgentRunEvent>();
  for (const item of prev) map.set(item.seq, item);
  for (const item of incoming) map.set(item.seq, item);
  return Array.from(map.values()).sort((a, b) => a.seq - b.seq);
}

function toMs(v: string | null | undefined): number {
  if (!v) return 0;
  const n = Date.parse(v);
  return Number.isFinite(n) ? n : 0;
}

function shouldSwitchRun(current: AgentRun | null, candidate: AgentRun): boolean {
  if (!current) return true;
  if (candidate.id === current.id) return true;
  return toMs(candidate.startedAt) >= toMs(current.startedAt);
}

function toInt(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toBundleStage(value: unknown): BundleStage | null {
  if (value === 'queued') return 'queued';
  if (value === 'building') return 'building';
  if (value === 'fixing') return 'fixing';
  if (value === 'retrying') return 'retrying';
  if (value === 'finalizing') return 'finalizing';
  if (value === 'ready') return 'ready';
  if (value === 'failed') return 'failed';
  return null;
}

function toBundlePlatform(value: unknown): 'ios' | 'android' | 'both' {
  if (value === 'ios' || value === 'android') return value;
  return 'both';
}

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function defaultBundleLabel(stage: BundleStage): string {
  if (stage === 'queued') return 'Queued for build';
  if (stage === 'building') return 'Building bundle';
  if (stage === 'fixing') return 'Applying auto-fix';
  if (stage === 'retrying') return 'Retrying bundle';
  if (stage === 'finalizing') return 'Finalizing artifacts';
  if (stage === 'ready') return 'Bundle ready';
  if (stage === 'failed') return 'Bundle failed';
  return 'Building bundle';
}

function fallbackBundleProgress(stage: BundleStage, startedAtMs: number, nowMs: number): number {
  if (stage === 'ready') return 1;
  if (stage === 'failed') return 0.96;
  const elapsed = Math.max(0, nowMs - startedAtMs);
  const expectedMs = 60_000;
  if (elapsed <= expectedMs) {
    const t = clamp01(elapsed / expectedMs);
    return 0.05 + 0.85 * (1 - Math.pow(1 - t, 2));
  }
  const over = elapsed - expectedMs;
  return Math.min(0.9 + 0.07 * (1 - Math.exp(-over / 25_000)), 0.97);
}

function deriveView(run: AgentRun | null, events: AgentRunEvent[], nowMs: number): AgentRunProgressView {
  const files: string[] = [];
  const fileSeen = new Set<string>();
  let todoSummary: AgentTodoSummary | null = null;
  let latestMessage: string | null = null;
  let phase = run?.currentPhase ?? null;
  let bundleStage: BundleStage | null = null;
  let bundleLabel: string | null = null;
  let bundleError: string | null = null;
  let bundleProgressHint: number | null = null;
  let bundlePlatform: 'ios' | 'android' | 'both' = 'both';
  let bundleStartedAtMs: number | null = null;
  let lastBundleSig: string | null = null;

  for (const ev of events) {
    if (ev.eventType === 'phase_changed') {
      if (typeof ev.payload?.message === 'string') latestMessage = ev.payload.message;
      if (ev.phase) phase = ev.phase;
    }
    if (ev.eventType === 'file_changed') {
      if (ev.path && !fileSeen.has(ev.path)) {
        fileSeen.add(ev.path);
        files.push(ev.path);
      }
    }
    if (ev.eventType === 'todo_updated') {
      todoSummary = {
        total: toInt(ev.payload?.total),
        pending: toInt(ev.payload?.pending),
        inProgress: toInt(ev.payload?.inProgress),
        completed: toInt(ev.payload?.completed),
        currentTask: typeof ev.payload?.currentTask === 'string' ? ev.payload.currentTask : null,
      };
    }

    const stageType = typeof ev.payload?.stage === 'string' ? ev.payload.stage : null;
    if (stageType !== 'bundle') continue;
    const nextStage = toBundleStage(ev.payload?.bundlePhase);
    if (!nextStage) continue;
    const nextPlatform = toBundlePlatform(ev.payload?.platform);
    const message = typeof ev.payload?.message === 'string' ? ev.payload.message : null;
    const phaseLabel = message || (typeof ev.payload?.message === 'string' ? ev.payload.message : null);
    const hintRaw = Number(ev.payload?.progressHint);
    const progressHint = Number.isFinite(hintRaw) ? clamp01(hintRaw) : null;
    const errorText = typeof ev.payload?.error === 'string' ? ev.payload.error : null;
    const sig = `${ev.seq}:${nextStage}:${nextPlatform}:${progressHint ?? 'none'}:${phaseLabel ?? 'none'}:${errorText ?? 'none'}`;
    if (sig === lastBundleSig) continue;
    lastBundleSig = sig;
    bundleStage = nextStage;
    bundlePlatform = nextPlatform;
    if (phaseLabel) bundleLabel = phaseLabel;
    if (progressHint != null) bundleProgressHint = progressHint;
    if (errorText) bundleError = errorText;
    const evMs = toMs(ev.createdAt);
    if (!bundleStartedAtMs && evMs > 0) bundleStartedAtMs = evMs;
  }

  if (!latestMessage) {
    if (phase === 'planning') latestMessage = 'Planning changes...';
    else if (phase === 'analyzing') latestMessage = 'Analyzing relevant files...';
    else if (phase === 'editing') latestMessage = 'Applying code updates...';
    else if (phase === 'validating') latestMessage = 'Validating updates...';
    else if (phase === 'finalizing') latestMessage = 'Finalizing response...';
    else if (phase) latestMessage = `Working (${phase})...`;
  }

  const runFinished = run?.status === 'succeeded' || run?.status === 'failed' || run?.status === 'cancelled';
  let bundle: AgentBundleProgressView | null = null;
  if (bundleStage && !runFinished) {
    const baseTime = bundleStartedAtMs ?? toMs(run?.startedAt) ?? nowMs;
    const fallback = fallbackBundleProgress(bundleStage, baseTime || nowMs, nowMs);
    const value = bundleProgressHint != null ? Math.max(fallback, bundleProgressHint) : fallback;
    const status = bundleStage === 'failed' ? 'failed' : bundleStage === 'ready' ? 'succeeded' : 'loading';
    bundle = {
      active: status === 'loading',
      status,
      phaseLabel: bundleLabel || defaultBundleLabel(bundleStage),
      progressValue: clamp01(value),
      errorMessage: bundleError,
      platform: bundlePlatform,
    };
  }

  return {
    runId: run?.id ?? null,
    status: run?.status ?? null,
    phase,
    latestMessage,
    changedFilesCount: fileSeen.size,
    recentFiles: files.slice(-5),
    todoSummary,
    bundle,
    events,
  };
}

export function useAgentRunProgress(threadId: string, opts?: { enabled?: boolean }): UseAgentRunProgressResult {
  const enabled = Boolean(opts?.enabled ?? true);
  const [run, setRun] = React.useState<AgentRun | null>(null);
  const [events, setEvents] = React.useState<AgentRunEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const activeRequestIdRef = React.useRef(0);
  const lastSeqRef = React.useRef(0);
  const runRef = React.useRef<AgentRun | null>(null);
  const foregroundSignal = useForegroundSignal(Boolean(threadId) && enabled);
  const [bundleTick, setBundleTick] = React.useState(0);

  React.useEffect(() => {
    lastSeqRef.current = 0;
    runRef.current = null;
  }, [threadId]);

  React.useEffect(() => {
    runRef.current = run;
  }, [run]);

  const refetch = React.useCallback(async () => {
    if (!threadId || !enabled) {
      setRun(null);
      setEvents([]);
      setLoading(false);
      setError(null);
      return;
    }
    const requestId = ++activeRequestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const latestRun = await agentProgressRepository.getLatestRun(threadId);
      if (activeRequestIdRef.current !== requestId) return;
      if (!latestRun) {
        setRun(null);
        setEvents([]);
        lastSeqRef.current = 0;
        return;
      }
      const initialEvents = await agentProgressRepository.listEvents(latestRun.id);
      if (activeRequestIdRef.current !== requestId) return;
      const sorted = [...initialEvents].sort((a, b) => a.seq - b.seq);
      setRun(latestRun);
      setEvents(sorted);
      lastSeqRef.current = sorted.length > 0 ? sorted[sorted.length - 1]!.seq : 0;
    } catch (e) {
      if (activeRequestIdRef.current !== requestId) return;
      setError(e instanceof Error ? e : new Error(String(e)));
      setRun(null);
      setEvents([]);
      lastSeqRef.current = 0;
    } finally {
      if (activeRequestIdRef.current === requestId) setLoading(false);
    }
  }, [enabled, threadId]);

  React.useEffect(() => {
    void refetch();
  }, [refetch]);

  React.useEffect(() => {
    if (!threadId || !enabled) return;
    if (foregroundSignal <= 0) return;
    void refetch();
  }, [enabled, foregroundSignal, refetch, threadId]);

  React.useEffect(() => {
    if (!threadId || !enabled) return;
    const unsubRuns = agentProgressRepository.subscribeThreadRuns(threadId, {
      onInsert: (nextRun) => {
        const currentRun = runRef.current;
        if (!shouldSwitchRun(currentRun, nextRun)) return;
        setRun(nextRun);
        runRef.current = nextRun;
        if (!currentRun || currentRun.id !== nextRun.id) {
          lastSeqRef.current = 0;
          setEvents([]);
          void agentProgressRepository
            .listEvents(nextRun.id)
            .then((initial) => {
              if (runRef.current?.id !== nextRun.id) return;
              setEvents((prev) => mergeMany(prev, initial));
              const maxSeq = initial.length > 0 ? initial[initial.length - 1]!.seq : 0;
              if (maxSeq > lastSeqRef.current) lastSeqRef.current = maxSeq;
            })
            .catch(() => {});
        }
      },
      onUpdate: (nextRun) => {
        const currentRun = runRef.current;
        if (!shouldSwitchRun(currentRun, nextRun)) return;
        setRun(nextRun);
        runRef.current = nextRun;
      },
    });
    return unsubRuns;
  }, [enabled, threadId, foregroundSignal]);

  React.useEffect(() => {
    if (!enabled || !run?.id) return;
    const runId = run.id;
    const processIncoming = (incoming: AgentRunEvent) => {
      if (runRef.current?.id !== runId) return;
      setEvents((prev) => upsertBySeq(prev, incoming));
      if (incoming.seq > lastSeqRef.current) {
        const expectedNext = lastSeqRef.current + 1;
        const seenSeq = incoming.seq;
        const currentLast = lastSeqRef.current;
        lastSeqRef.current = seenSeq;
        if (seenSeq > expectedNext) {
          void agentProgressRepository
            .listEvents(runId, currentLast)
            .then((missing) => {
              if (runRef.current?.id !== runId) return;
              setEvents((prev) => mergeMany(prev, missing));
              if (missing.length > 0) {
                const maxSeq = missing[missing.length - 1]!.seq;
                if (maxSeq > lastSeqRef.current) lastSeqRef.current = maxSeq;
              }
            })
            .catch(() => {});
        }
      }
    };
    const unsubscribe = agentProgressRepository.subscribeRunEvents(runId, {
      onInsert: processIncoming,
      onUpdate: processIncoming,
    });
    return unsubscribe;
  }, [enabled, run?.id, foregroundSignal]);

  const view = React.useMemo(() => deriveView(run, events, Date.now()), [bundleTick, events, run]);
  React.useEffect(() => {
    if (!view.bundle?.active) return;
    const interval = setInterval(() => {
      setBundleTick((v) => v + 1);
    }, 300);
    return () => clearInterval(interval);
  }, [view.bundle?.active]);
  const hasLiveProgress = Boolean(run) && run?.status === 'running';
  return { run, view, loading, error, hasLiveProgress, refetch };
}

