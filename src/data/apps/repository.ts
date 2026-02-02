import type {
  App,
  AppAnalyticsParams,
  AppAnalyticsPoint,
  AppInsights,
  AppsSummary,
  ForkAppRequest,
  ImportGithubAppRequest,
  ImportGithubAppResponse,
  ListAppsSummaryParams,
  ListLikedAppsParams,
  ListPublicAppsParams,
  LikedAppsList,
  SyncUpstreamResponse,
} from './types';
import { appsRemoteDataSource } from './remote';
import type { AppsRemoteDataSource } from './remote';
import { BaseRepository } from '../../data/base-repository';
import { subscribeManagedChannel } from '../../core/services/supabase/realtimeManager';

type DbAppRow = {
  id: string;
  name: string;
  description: string | null;
  apple_app_store_category: string | null;
  google_play_category: string | null;
  pg_rating: string | null;
  project_id: string;
  platform: string | null;
  is_public: boolean;
  created_by: string;
  status: App['status'];
  status_error: string | null;
  status_changed_at: string | null;
  head_commit_id: string | null;
  forked_from_commit_id: string | null;
  forked_from_app_id: string | null;
  thread_id: string | null;
  created_at: string;
  updated_at: string;
};

type AppSubscriptionHandlers = {
  onInsert?: (app: App) => void;
  onUpdate?: (app: App) => void;
  onDelete?: (app: App) => void;
};

function mapDbAppRow(row: DbAppRow): App {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    appleAppStoreCategory: row.apple_app_store_category,
    googlePlayCategory: row.google_play_category,
    pgRating: row.pg_rating,
    projectId: row.project_id,
    platform: row.platform,
    isPublic: row.is_public,
    createdBy: row.created_by,
    status: row.status,
    statusError: row.status_error,
    statusChangedAt: row.status_changed_at,
    headCommitId: row.head_commit_id,
    forkedFromCommitId: row.forked_from_commit_id,
    forkedFromAppId: row.forked_from_app_id,
    threadId: row.thread_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    insights: null,
  };
}

export interface AppsRepository {
  list(projectId?: string): Promise<App[]>;
  listPublicOthers(params?: ListPublicAppsParams): Promise<App[]>;
  getSummary(params?: ListAppsSummaryParams): Promise<AppsSummary>;
  listLiked(params?: ListLikedAppsParams): Promise<LikedAppsList>;
  getById(appId: string): Promise<App>;
  fork(appId: string, payload: ForkAppRequest): Promise<App>;
  getInsights(appId: string): Promise<AppInsights>;
  getAnalytics(appId: string, params: AppAnalyticsParams): Promise<AppAnalyticsPoint[]>;
  subscribeCreatedApps(userId: string, handlers: AppSubscriptionHandlers): () => void;
  subscribeApp(appId: string, handlers: AppSubscriptionHandlers): () => void;
  importFromGithub(payload: ImportGithubAppRequest): Promise<ImportGithubAppResponse>;
  syncUpstream(appId: string): Promise<SyncUpstreamResponse>;
}

class AppsRepositoryImpl extends BaseRepository implements AppsRepository {
  constructor(private readonly remote: AppsRemoteDataSource) {
    super();
  }

  async list(projectId?: string): Promise<App[]> {
    const res = await this.remote.list(projectId);
    return this.unwrapOrThrow(res);
  }

  async listPublicOthers(params?: ListPublicAppsParams): Promise<App[]> {
    const res = await this.remote.listPublicOthers(params);
    return this.unwrapOrThrow(res);
  }

  async getSummary(params?: ListAppsSummaryParams): Promise<AppsSummary> {
    const res = await this.remote.listSummary(params);
    return this.unwrapOrThrow(res);
  }

  async listLiked(params?: ListLikedAppsParams): Promise<LikedAppsList> {
    const res = await this.remote.listLiked(params);
    return this.unwrapOrThrow(res);
  }

  async getById(appId: string): Promise<App> {
    const res = await this.remote.getById(appId);
    return this.unwrapOrThrow(res);
  }

  async fork(appId: string, payload: ForkAppRequest): Promise<App> {
    const res = await this.remote.fork(appId, payload);
    return this.unwrapOrThrow(res);
  }

  async getInsights(appId: string): Promise<AppInsights> {
    const res = await this.remote.getInsights(appId);
    return this.unwrapOrThrow(res);
  }

  async getAnalytics(appId: string, params: AppAnalyticsParams): Promise<AppAnalyticsPoint[]> {
    const res = await this.remote.getAnalytics(appId, params);
    return this.unwrapOrThrow(res);
  }

  async importFromGithub(payload: ImportGithubAppRequest): Promise<ImportGithubAppResponse> {
    const res = await this.remote.importFromGithub(payload);
    return this.unwrapOrThrow(res);
  }

  async syncUpstream(appId: string): Promise<SyncUpstreamResponse> {
    const res = await this.remote.syncUpstream(appId);
    return this.unwrapOrThrow(res);
  }

  subscribeCreatedApps(userId: string, handlers: AppSubscriptionHandlers): () => void {
    if (!userId) return () => {};
    return this.subscribeToAppChannel(`apps:createdBy:${userId}`, `created_by=eq.${userId}`, handlers);
  }

  subscribeApp(appId: string, handlers: AppSubscriptionHandlers): () => void {
    if (!appId) return () => {};
    return this.subscribeToAppChannel(`apps:id:${appId}`, `id=eq.${appId}`, handlers);
  }

  private subscribeToAppChannel(channelKey: string, filter: string, handlers: AppSubscriptionHandlers): () => void {
    return subscribeManagedChannel(channelKey, (channel) => {
      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'app', filter },
          (payload) => {
            console.log('[subscribeToAppChannel] onInsert', payload);
            handlers.onInsert?.(mapDbAppRow(payload.new as DbAppRow));
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'app', filter },
          (payload) => {
            console.log('[subscribeToAppChannel] onUpdate', payload);
            handlers.onUpdate?.(mapDbAppRow(payload.new as DbAppRow));
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'app', filter },
          (payload) => {
            console.log('[subscribeToAppChannel] onDelete', payload);
            handlers.onDelete?.(mapDbAppRow(payload.old as DbAppRow));
          }
        );
    });
  }
}

export const appsRepository: AppsRepository = new AppsRepositoryImpl(appsRemoteDataSource);


