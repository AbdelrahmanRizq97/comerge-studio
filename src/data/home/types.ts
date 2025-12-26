export type HomeProfile = {
  name: string | null;
  email: string | null;
  avatar: string | null;
};

export type HomeNotificationGroup = {
  appId: string;
  appName: string;
  threadId: string | null;
  count: number;
};

export type HomeNotifications = {
  totalCount: number;
  groups: HomeNotificationGroup[];
};

export type HomeSummary = {
  profile: HomeProfile;
  notifications: HomeNotifications;
};

export type HomeSectionAppStats = {
  totalDownloads: number;
  totalDownloadUsers: number;
  totalLikes: number;
  totalComments: number;
  totalRatings: number;
  averageRating: number | null;
  totalMergeRequests: number;
  totalForks: number;
};

export type HomeSectionAppDetails = {
  id: string;
  name: string;
  description: string | null;
  isLiked?: boolean;
  url: string | null;
  platform: string | null;
  isPublic: boolean;
  status: string | null;
  lastUpdatedAt: string;
  stats: HomeSectionAppStats | null;
};

export type HomeSectionApp = {
  id: string;
  appId: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  app: HomeSectionAppDetails;
};

export type HomeSection = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  layoutType: 'vertical_list' | 'horizontal_list' | 'grid' | 'carousel';
  isPublished: boolean;
  sortOrder: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  listOfApps: HomeSectionApp[];
};

