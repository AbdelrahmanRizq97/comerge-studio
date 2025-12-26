import type { Message } from '../../data/messages/types';

type MessagePayload = { type?: string; content?: unknown; text?: unknown; prompt?: unknown; message?: unknown };

export function getLastOutcomeIndex(messages: Message[]): number {
  let idx = -1;
  for (let i = 0; i < messages.length; i += 1) {
    const payload = messages[i].payload as MessagePayload | undefined;
    if (payload?.type === 'outcome') idx = i;
  }
  return idx;
}

export function hasNoOutcomeAfterLastHuman(messages: Message[]): boolean {
  if (!messages || messages.length === 0) return false;

  let lastHumanIndex = -1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].authorType === 'human') {
      lastHumanIndex = i;
      break;
    }
  }
  if (lastHumanIndex === -1) return false;

  for (let i = lastHumanIndex + 1; i < messages.length; i += 1) {
    const m = messages[i];
    const payload = m.payload as MessagePayload | undefined;
    if (m.authorType === 'ai' && payload?.type === 'outcome') return false;
  }
  return true;
}


