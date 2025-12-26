export type AppCommentLike = {
  id: string;
  appId: string;
  commentId: string;
  userId: string;
  source: string | null;
  context: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ListAppCommentLikesQuery = {
  page?: number;
  pageSize?: number;
  userId?: string;
};

export type CreateAppCommentLikeInput = {
  source?: string;
  context?: Record<string, unknown>;
};

export type AppCommentLikeStats = {
  total?: number;
};

export type AppCommentLikeList = {
  items: AppCommentLike[];
  pageInfo: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  stats?: AppCommentLikeStats;
};

export type AppCommentLikeMutationResult = {
  like: AppCommentLike;
  stats?: AppCommentLikeStats;
};

export type AppCommentLikeStatsResult = {
  stats?: AppCommentLikeStats;
};


