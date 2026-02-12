export const STUDIO_ANALYTICS_EVENT_VERSION = 1 as const;

type ErrorMetadata = {
  error_code?: string;
  error_domain?: string;
};

export type InteractionSource = 'preview_panel' | 'unknown';

export type RemixAppEventProperties = {
  app_id: string;
  source_app_id: string;
  thread_id?: string;
  success: boolean;
} & ErrorMetadata;

export type EditAppEventProperties = {
  app_id: string;
  thread_id: string;
  prompt_length: number;
  success: boolean;
} & ErrorMetadata;

export type ShareAppEventProperties = {
  app_id: string;
  success: boolean;
} & ErrorMetadata;

export type OpenMergeRequestEventProperties = {
  app_id: string;
  merge_request_id?: string;
  success: boolean;
} & ErrorMetadata;

export type ApproveMergeRequestEventProperties = {
  app_id: string;
  merge_request_id: string;
  success: boolean;
} & ErrorMetadata;

export type RejectMergeRequestEventProperties = {
  app_id: string;
  merge_request_id: string;
  success: boolean;
} & ErrorMetadata;

export type TestBundleEventProperties = {
  app_id: string;
  commit_id?: string;
  success: boolean;
} & ErrorMetadata;

export type LikeAppEventProperties = {
  app_id: string;
  source: InteractionSource;
  success: boolean;
} & ErrorMetadata;

export type UnlikeAppEventProperties = {
  app_id: string;
  source: InteractionSource;
  success: boolean;
} & ErrorMetadata;

export type OpenCommentsEventProperties = {
  app_id: string;
  source: InteractionSource;
};

export type SubmitCommentEventProperties = {
  app_id: string;
  comment_type: 'general';
  comment_length: number;
  success: boolean;
} & ErrorMetadata;

export type StudioAnalyticsEventMap = {
  remix_app: RemixAppEventProperties;
  edit_app: EditAppEventProperties;
  share_app: ShareAppEventProperties;
  open_merge_request: OpenMergeRequestEventProperties;
  approve_merge_request: ApproveMergeRequestEventProperties;
  reject_merge_request: RejectMergeRequestEventProperties;
  test_bundle: TestBundleEventProperties;
  like_app: LikeAppEventProperties;
  unlike_app: UnlikeAppEventProperties;
  open_comments: OpenCommentsEventProperties;
  submit_comment: SubmitCommentEventProperties;
};

export type StudioAnalyticsEventName = keyof StudioAnalyticsEventMap;

export type StudioAnalyticsBaseProperties = {
  event_version: typeof STUDIO_ANALYTICS_EVENT_VERSION;
};

export type StudioAnalyticsEventPayload<TName extends StudioAnalyticsEventName> =
  StudioAnalyticsEventMap[TName] & StudioAnalyticsBaseProperties;
