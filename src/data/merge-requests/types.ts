export type MergeRequestStatus = 'open' | 'approved' | 'rejected' | 'merged' | 'closed';
export type MergeRequestsByStatus = Partial<Record<MergeRequestStatus, MergeRequest[]>>;

export type MergeRequest = {
  id: string;
  sourceAppId: string;
  sourceCommitId: string;
  sourceTipCommitId: string | null;
  targetAppId: string;
  targetCommitId: string | null;
  status: MergeRequestStatus;
  title: string | null;
  description: string | null;
  createdBy: string;
  reviewedBy: string | null;
  mergedBy: string | null;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  closedAt: string | null;
};

export type OpenMergeRequestRequest = {
  sourceAppId: string;
};

export type UpdateMergeRequestRequest = {
  title?: string;
  description?: string;
  status?: MergeRequestStatus;
};


