export type CommentType = 'general' | 'review' | 'bug' | 'question' | 'idea' | 'other';

export type CommentMediaItem = {
  id?: string;
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'video' | 'file' | 'other';
  alt?: string;
  metadata?: Record<string, unknown>;
};

export type AppComment = {
  id: string;
  appId: string;
  authorId: string;
  commentType: CommentType;
  description: string | null;
  body: string | null;
  bodyRich: Record<string, unknown> | null;
  media: CommentMediaItem[];
  metadata: Record<string, unknown>;
  parentCommentId: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
  lastEditedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateAppCommentInput = {
  commentType?: CommentType;
  description?: string | null;
  body?: string | null;
  bodyRich?: Record<string, unknown> | null;
  media?: CommentMediaItem[];
  metadata?: Record<string, unknown>;
  parentCommentId?: string | null;
};

export type UpdateAppCommentInput = Partial<CreateAppCommentInput>;

export type ListAppCommentsQuery = {
  page?: number;
  pageSize?: number;
  parentCommentId?: string | null;
  includeDeleted?: boolean;
};

export type AppCommentList = {
  items: AppComment[];
  pageInfo: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
};


