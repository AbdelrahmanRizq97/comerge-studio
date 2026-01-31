export type AppInsightsSummary = {
  totalDownloads: number;
  totalDownloadUsers: number;
  totalLikes: number;
  totalComments: number;
  totalRatings: number;
  averageRating: number | null;
  totalMergeRequests: number;
  totalForks: number;
};

export type DownloadUserSummary = {
  userId: string;
  totalDownloads: number;
  lastDownloadAt: string | null;
};

export type ForkEntry = {
  appId: string;
  userId: string;
  createdAt: string;
};

export type MergeRequestEntry = {
  id: string;
  sourceAppId: string;
  createdBy: string;
  status: string;
  createdAt: string;
};

export type SyncRequestEntry = MergeRequestEntry;

export type LikeEntry = {
  userId: string;
  createdAt: string;
};

export type CommentEntry = {
  id: string;
  userId: string;
  commentType: string;
  createdAt: string;
};

export type RatingEntry = {
  userId: string;
  rating: number;
  createdAt: string;
};

export type AppInsights = {
  downloads: {
    total: number;
    uniqueUsers: number;
    perUser: DownloadUserSummary[];
  };
  forks: {
    total: number;
    entries: ForkEntry[];
  };
  mergeRequests: {
    total: number;
    approved: number;
    merged: number;
    entries: MergeRequestEntry[];
  };
  syncs: {
    total: number;
    approved: number;
    merged: number;
    entries: SyncRequestEntry[];
  };
  likes: {
    total: number;
    entries: LikeEntry[];
  };
  comments: {
    total: number;
    entries: CommentEntry[];
  };
  ratings: {
    total: number;
    average: number | null;
    entries: RatingEntry[];
  };
};

export const APP_METRIC_TYPES = [
  'downloads',
  'likes',
  'comments',
  'forks',
  'mergeRequests',
  'mergeRequestApprovals',
] as const;

export type AppMetricType = (typeof APP_METRIC_TYPES)[number];

export const APP_ANALYTIC_INTERVALS = ['day', 'hour'] as const;

export type AppAnalyticsInterval = (typeof APP_ANALYTIC_INTERVALS)[number];

export type AppAnalyticsParams = {
  type: AppMetricType;
  startDate: string;
  endDate: string;
  interval?: AppAnalyticsInterval;
};

export type AppAnalyticsPoint = {
  date: string;
  value: number;
};

export type App = {
  id: string;
  name: string;
  description: string | null;
  appleAppStoreCategory: string | null;
  googlePlayCategory: string | null;
  pgRating: string | null;
  projectId: string;
  platform: string | null;
  isPublic: boolean;
  isLiked?: boolean;
  createdBy: string;
  status: 'ready' | 'creating' | 'editing' | 'forking' | 'merging' | 'error' | 'archived';
  statusError: string | null;
  statusChangedAt: string | null;
  headCommitId: string | null;
  forkedFromCommitId: string | null;
  forkedFromAppId: string | null;
  threadId: string | null;
  createdAt: string;
  updatedAt: string;
  insights?: AppInsightsSummary | null;
};

export type AppStatus = App['status'];

export type ForkAppRequest = {
  name?: string;
  platform?: string;
  forkedFromCommitId?: string;
};

export type SyncUpstreamStatus = 'up-to-date' | 'queued';

export type SyncUpstreamResponse = {
  status: SyncUpstreamStatus;
  mergeRequestId?: string;
};

export type ImportGithubAppRequest = {
  repoFullName: string;
  branch?: string;
  path?: string;
  appName?: string;
  threadId?: string;
};

export type ImportGithubAppResponse = {
  appId: string;
  projectId: string;
  threadId: string;
};

export type ListPublicAppsParams = {
  limit?: number;
  offset?: number;
  q?: string;
};

export type ListAppsSummaryParams = ListPublicAppsParams & {
  projectId?: string;
};

export type AppsSummary = {
  mine: App[];
  public: App[];
  pagination: {
    limit: number;
    offset: number;
    q: string | null;
  };
};

export type ListLikedAppsParams = {
  limit?: number;
  offset?: number;
};

export type LikedAppListItem = {
  likeId: string;
  appId: string;
  likedAt: string;
  app: App;
};

export type LikedAppsList = {
  items: LikedAppListItem[];
  pageInfo: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
};

export const APP_STATUS_LABEL: Record<AppStatus, string> = {
  ready: 'Ready',
  creating: 'Creating',
  editing: 'Editing',
  forking: 'Forking',
  merging: 'Merging',
  error: 'Error',
  archived: 'Archived',
};


