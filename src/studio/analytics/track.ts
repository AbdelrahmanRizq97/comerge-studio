import { flushStudioAnalytics, trackStudioEvent } from './client';
import {
  STUDIO_ANALYTICS_EVENT_VERSION,
  type InteractionSource,
  type StudioAnalyticsEventPayload,
} from './events';

function baseProps() {
  return { event_version: STUDIO_ANALYTICS_EVENT_VERSION } as const;
}

function normalizeError(error: unknown): { error_code?: string; error_domain?: string } {
  if (!error) return {};

  if (typeof error === 'string') {
    return { error_code: error.slice(0, 120), error_domain: 'string' };
  }

  if (error instanceof Error) {
    return {
      error_code: error.message.slice(0, 120),
      error_domain: error.name || 'Error',
    };
  }

  if (typeof error === 'object') {
    const candidate = error as { code?: string | number; name?: string; message?: string };
    return {
      error_code: String(candidate.code ?? candidate.message ?? 'unknown_error').slice(0, 120),
      error_domain: candidate.name ?? 'object',
    };
  }

  return { error_code: 'unknown_error', error_domain: typeof error };
}

async function trackMutationEvent<TName extends keyof Omit<{
  remix_app: true;
  edit_app: true;
  share_app: true;
  open_merge_request: true;
  approve_merge_request: true;
  reject_merge_request: true;
  test_bundle: true;
  like_app: true;
  unlike_app: true;
  submit_comment: true;
  related_app_switched: true;
  related_app_switch_failed: true;
}, never>>(
  name: TName,
  payload: StudioAnalyticsEventPayload<TName>
) {
  await trackStudioEvent(name, payload);
  await flushStudioAnalytics();
}

let lastOpenCommentsKey: string | null = null;
let lastOpenCommentsAt = 0;

export async function trackRemixApp(params: {
  appId: string;
  sourceAppId: string;
  threadId?: string;
  success: boolean;
  error?: unknown;
}) {
  const errorProps = params.success ? {} : normalizeError(params.error);
  await trackMutationEvent('remix_app', {
    app_id: params.appId,
    source_app_id: params.sourceAppId,
    thread_id: params.threadId,
    success: params.success,
    ...errorProps,
    ...baseProps(),
  });
}

export async function trackEditApp(params: {
  appId: string;
  threadId: string;
  promptLength: number;
  success: boolean;
  error?: unknown;
}) {
  const errorProps = params.success ? {} : normalizeError(params.error);
  await trackMutationEvent('edit_app', {
    app_id: params.appId,
    thread_id: params.threadId,
    prompt_length: params.promptLength,
    success: params.success,
    ...errorProps,
    ...baseProps(),
  });
}

export async function trackShareApp(params: {
  appId: string;
  success: boolean;
  error?: unknown;
}) {
  const errorProps = params.success ? {} : normalizeError(params.error);
  await trackMutationEvent('share_app', {
    app_id: params.appId,
    success: params.success,
    ...errorProps,
    ...baseProps(),
  });
}

export async function trackOpenMergeRequest(params: {
  appId: string;
  mergeRequestId?: string;
  success: boolean;
  error?: unknown;
}) {
  const errorProps = params.success ? {} : normalizeError(params.error);
  await trackMutationEvent('open_merge_request', {
    app_id: params.appId,
    merge_request_id: params.mergeRequestId,
    success: params.success,
    ...errorProps,
    ...baseProps(),
  });
}

export async function trackApproveMergeRequest(params: {
  appId: string;
  mergeRequestId: string;
  success: boolean;
  error?: unknown;
}) {
  const errorProps = params.success ? {} : normalizeError(params.error);
  await trackMutationEvent('approve_merge_request', {
    app_id: params.appId,
    merge_request_id: params.mergeRequestId,
    success: params.success,
    ...errorProps,
    ...baseProps(),
  });
}

export async function trackRejectMergeRequest(params: {
  appId: string;
  mergeRequestId: string;
  success: boolean;
  error?: unknown;
}) {
  const errorProps = params.success ? {} : normalizeError(params.error);
  await trackMutationEvent('reject_merge_request', {
    app_id: params.appId,
    merge_request_id: params.mergeRequestId,
    success: params.success,
    ...errorProps,
    ...baseProps(),
  });
}

export async function trackTestBundle(params: {
  appId: string;
  commitId?: string;
  success: boolean;
  error?: unknown;
}) {
  const errorProps = params.success ? {} : normalizeError(params.error);
  await trackMutationEvent('test_bundle', {
    app_id: params.appId,
    commit_id: params.commitId,
    success: params.success,
    ...errorProps,
    ...baseProps(),
  });
}

export async function trackLikeApp(params: {
  appId: string;
  source?: InteractionSource;
  success: boolean;
  error?: unknown;
}) {
  const errorProps = params.success ? {} : normalizeError(params.error);
  await trackMutationEvent('like_app', {
    app_id: params.appId,
    source: params.source ?? 'unknown',
    success: params.success,
    ...errorProps,
    ...baseProps(),
  });
}

export async function trackUnlikeApp(params: {
  appId: string;
  source?: InteractionSource;
  success: boolean;
  error?: unknown;
}) {
  const errorProps = params.success ? {} : normalizeError(params.error);
  await trackMutationEvent('unlike_app', {
    app_id: params.appId,
    source: params.source ?? 'unknown',
    success: params.success,
    ...errorProps,
    ...baseProps(),
  });
}

export async function trackOpenComments(params: {
  appId: string;
  source?: InteractionSource;
}) {
  const key = `${params.appId}:${params.source ?? 'unknown'}`;
  const now = Date.now();
  if (lastOpenCommentsKey === key && now - lastOpenCommentsAt < 1000) return;
  lastOpenCommentsKey = key;
  lastOpenCommentsAt = now;

  await trackStudioEvent('open_comments', {
    app_id: params.appId,
    source: params.source ?? 'unknown',
    ...baseProps(),
  });
}

export async function trackSubmitComment(params: {
  appId: string;
  commentLength: number;
  success: boolean;
  error?: unknown;
}) {
  const errorProps = params.success ? {} : normalizeError(params.error);
  await trackMutationEvent('submit_comment', {
    app_id: params.appId,
    comment_type: 'general',
    comment_length: params.commentLength,
    success: params.success,
    ...errorProps,
    ...baseProps(),
  });
}

export async function trackRelatedAppsOpened(params: {
  appId: string;
  relatedCount: number;
}) {
  await trackStudioEvent('related_apps_opened', {
    app_id: params.appId,
    related_count: params.relatedCount,
    ...baseProps(),
  });
}

export async function trackRelatedAppSwitched(params: {
  fromAppId: string;
  toAppId: string;
  targetType: 'original' | 'remix';
}) {
  await trackMutationEvent('related_app_switched', {
    from_app_id: params.fromAppId,
    to_app_id: params.toAppId,
    target_type: params.targetType,
    ...baseProps(),
  });
}

export async function trackRelatedAppSwitchFailed(params: {
  fromAppId: string;
  toAppId: string;
  reason: string;
  error?: unknown;
}) {
  const errorProps = normalizeError(params.error);
  await trackMutationEvent('related_app_switch_failed', {
    from_app_id: params.fromAppId,
    to_app_id: params.toAppId,
    reason: params.reason,
    ...errorProps,
    ...baseProps(),
  });
}
