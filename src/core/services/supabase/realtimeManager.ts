import { log } from '../../logger';
import { getSupabaseClient } from './client';

type SupabaseClient = ReturnType<typeof getSupabaseClient>;
type RealtimeChannel = ReturnType<SupabaseClient['channel']>;
type ChannelConfigurer = (channel: RealtimeChannel) => void;

type ChannelEntry = {
  key: string;
  channel: RealtimeChannel | null;
  subscribers: Map<number, ChannelConfigurer>;
  backoffMs: number;
  timer: ReturnType<typeof setTimeout> | null;
};

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

const realtimeLog = log.extend('realtime');
const entries = new Map<string, ChannelEntry>();
let subscriberIdCounter = 0;
let resetTimer: ReturnType<typeof setTimeout> | null = null;

function clearTimer(entry: ChannelEntry) {
  if (!entry.timer) return;
  clearTimeout(entry.timer);
  entry.timer = null;
}

function buildChannel(entry: ChannelEntry): RealtimeChannel {
  const supabase = getSupabaseClient();
  const channel = supabase.channel(entry.key);
  entry.subscribers.forEach((configure) => {
    configure(channel);
  });
  return channel;
}

function scheduleResubscribe(entry: ChannelEntry, reason: string) {
  if (entry.timer) return;
  const delay = entry.backoffMs;
  entry.backoffMs = Math.min(entry.backoffMs * 2, MAX_BACKOFF_MS);
  realtimeLog.warn(`[realtime] channel ${entry.key} ${reason}; resubscribe in ${delay}ms`);
  entry.timer = setTimeout(() => {
    entry.timer = null;
    if (!entries.has(entry.key)) return;
    if (entry.subscribers.size === 0) return;
    subscribeChannel(entry);
  }, delay);
}

function handleStatus(entry: ChannelEntry, status: string) {
  if (status === 'SUBSCRIBED') {
    entry.backoffMs = INITIAL_BACKOFF_MS;
    clearTimer(entry);
    return;
  }
  if (status === 'CLOSED' || status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
    scheduleResubscribe(entry, status);
  }
}

function subscribeChannel(entry: ChannelEntry) {
  try {
    const supabase = getSupabaseClient();
    if (entry.channel) supabase.removeChannel(entry.channel);
    const channel = buildChannel(entry);
    entry.channel = channel;
    channel.subscribe((status: string) => handleStatus(entry, status));
  } catch (error) {
    realtimeLog.warn('[realtime] subscribe failed', error);
    scheduleResubscribe(entry, 'SUBSCRIBE_FAILED');
  }
}

function unsubscribeChannel(entry: ChannelEntry) {
  if (!entry.channel) return;
  try {
    entry.channel.unsubscribe?.();
  } catch (error) {
    realtimeLog.warn('[realtime] unsubscribe failed', error);
  }
  entry.channel = null;
}

export function resetRealtimeState(reason: string) {
  realtimeLog.warn(`[realtime] reset state ${reason}`);
  entries.forEach((entry) => {
    clearTimer(entry);
    entry.backoffMs = INITIAL_BACKOFF_MS;
    unsubscribeChannel(entry);
  });
  entries.clear();
}

function resubscribeAll() {
  entries.forEach((entry) => {
    if (entry.subscribers.size === 0) return;
    subscribeChannel(entry);
  });
}

export function resetRealtime(reason: string) {
  if (resetTimer) return;
  resetTimer = setTimeout(() => {
    resetTimer = null;
    const supabase = getSupabaseClient();
    realtimeLog.warn(`[realtime] full reset ${reason}`);
    entries.forEach((entry) => {
      clearTimer(entry);
      entry.backoffMs = INITIAL_BACKOFF_MS;
      if (entry.channel) supabase.removeChannel(entry.channel);
      entry.channel = null;
    });
    try {
      supabase.realtime?.disconnect?.();
    } catch (error) {
      realtimeLog.warn('[realtime] disconnect failed', error);
    }
    try {
      supabase.realtime?.connect?.();
    } catch (error) {
      realtimeLog.warn('[realtime] connect failed', error);
    }
    resubscribeAll();
  }, 250);
}

export function subscribeManagedChannel(key: string, configure: ChannelConfigurer): () => void {
  let entry = entries.get(key);
  if (!entry) {
    entry = {
      key,
      channel: null,
      subscribers: new Map(),
      backoffMs: INITIAL_BACKOFF_MS,
      timer: null,
    };
    entries.set(key, entry);
  }

  const subscriberId = ++subscriberIdCounter;
  entry.subscribers.set(subscriberId, configure);

  if (!entry.channel) {
    subscribeChannel(entry);
  } else {
    configure(entry.channel);
  }

  return () => {
    const current = entries.get(key);
    if (!current) return;
    current.subscribers.delete(subscriberId);
    if (current.subscribers.size === 0) {
      clearTimer(current);
      try {
        if (current.channel) getSupabaseClient().removeChannel(current.channel);
      } finally {
        entries.delete(key);
      }
      return;
    }
    subscribeChannel(current);
  };
}
