export type AppRating = {
  id: string;
  appId: string;
  userId: string;
  rating: number;
  commentId: string | null;
  title: string | null;
  review: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ListAppRatingsQuery = {
  page?: number;
  pageSize?: number;
  userId?: string;
  minRating?: number;
  maxRating?: number;
};

export type CreateAppRatingInput = {
  rating: number;
  commentId?: string | null;
  title?: string | null;
  review?: string | null;
  metadata?: Record<string, unknown>;
};

export type UpdateAppRatingInput = Partial<CreateAppRatingInput>;

export type AppRatingStats = {
  total?: number;
  average?: number | null;
};

export type AppRatingList = {
  items: AppRating[];
  pageInfo: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  stats: AppRatingStats;
};

export type AppRatingMutationResult = {
  rating: AppRating;
  stats?: AppRatingStats;
};

export type AppRatingStatsResult = {
  stats?: AppRatingStats;
};


