export type UserStats = {
  userId: string;
  name: string | null;
  avatar: string | null;
  approvedOpenedMergeRequests: number;
  totalOpenedMergeRequests: number;
};

export type UserStatsBatchResponse = {
  stats: Record<string, UserStats | null>;
  errors?: Record<string, { message: string; statusCode: number }>;
};



