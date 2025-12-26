export type AppLike = {
  id: string;
  appId: string;
  userId: string;
  source: string | null;
  context: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ListAppLikesQuery = {
  page?: number;
  pageSize?: number;
  userId?: string;
};

export type CreateAppLikeInput = {
  source?: string;
  context?: Record<string, unknown>;
};

export type AppLikeStats = {
  total?: number;
};

export type AppLikeList = {
  items: AppLike[];
  pageInfo: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  stats: AppLikeStats;
};

export type AppLikeMutationResult = {
  like: AppLike;
  stats?: AppLikeStats;
};

export type AppLikeStatsResult = {
  stats?: AppLikeStats;
};


