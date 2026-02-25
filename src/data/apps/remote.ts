import { api } from '../../core/services/http';
import type { ServiceResponse } from '../types';
import { BaseRemote } from '../base-remote';
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
  RelatedApps,
  SyncUpstreamResponse,
} from './types';

export interface AppsRemoteDataSource {
  list(projectId?: string): Promise<ServiceResponse<App[]>>;
  listPublicOthers(params?: ListPublicAppsParams): Promise<ServiceResponse<App[]>>;
  listSummary(params?: ListAppsSummaryParams): Promise<ServiceResponse<AppsSummary>>;
  listLiked(params?: ListLikedAppsParams): Promise<ServiceResponse<LikedAppsList>>;
  getById(appId: string): Promise<ServiceResponse<App>>;
  getRelated(appId: string): Promise<ServiceResponse<RelatedApps>>;
  fork(appId: string, payload: ForkAppRequest): Promise<ServiceResponse<App>>;
  getInsights(appId: string): Promise<ServiceResponse<AppInsights>>;
  getAnalytics(appId: string, params: AppAnalyticsParams): Promise<ServiceResponse<AppAnalyticsPoint[]>>;
  importFromGithub(payload: ImportGithubAppRequest): Promise<ServiceResponse<ImportGithubAppResponse>>;
  syncUpstream(appId: string): Promise<ServiceResponse<SyncUpstreamResponse>>;
}

class AppsRemoteDataSourceImpl extends BaseRemote implements AppsRemoteDataSource {
  async list(projectId?: string): Promise<ServiceResponse<App[]>> {
    const params = projectId ? { projectId } : undefined;
    const { data } = await api.get<ServiceResponse<App[]>>('/v1/apps', { params });
    return data;
  }

  async listPublicOthers(params?: ListPublicAppsParams): Promise<ServiceResponse<App[]>> {
    const query = params ? { ...params } : undefined;
    const { data } = await api.get<ServiceResponse<App[]>>('/v1/apps/public', { params: query });
    return data;
  }

  async listSummary(params?: ListAppsSummaryParams): Promise<ServiceResponse<AppsSummary>> {
    const query = params ? { ...params } : undefined;
    const { data } = await api.get<ServiceResponse<AppsSummary>>('/v1/apps/summary', {
      params: query,
    });
    return data;
  }

  async listLiked(params?: ListLikedAppsParams): Promise<ServiceResponse<LikedAppsList>> {
    const query = params ? { ...params } : undefined;
    const { data } = await api.get<ServiceResponse<LikedAppsList>>('/v1/apps/likes/mine', {
      params: query,
    });
    return data;
  }

  async getById(appId: string): Promise<ServiceResponse<App>> {
    const { data } = await api.get<ServiceResponse<App>>(`/v1/apps/${encodeURIComponent(appId)}`);
    return data;
  }

  async getRelated(appId: string): Promise<ServiceResponse<RelatedApps>> {
    const { data } = await api.get<ServiceResponse<RelatedApps>>(`/v1/apps/${encodeURIComponent(appId)}/related`);
    return data;
  }

  async fork(appId: string, payload: ForkAppRequest): Promise<ServiceResponse<App>> {
    const { data } = await api.post<ServiceResponse<App>>(`/v1/apps/${encodeURIComponent(appId)}/fork`, payload);
    return data;
  }

  async importFromGithub(payload: ImportGithubAppRequest): Promise<ServiceResponse<ImportGithubAppResponse>> {
    const { data } = await api.post<ServiceResponse<ImportGithubAppResponse>>('/v1/apps/import/github', payload);
    return data;
  }

  async getInsights(appId: string): Promise<ServiceResponse<AppInsights>> {
    const { data } = await api.get<ServiceResponse<AppInsights>>(
      `/v1/apps/${encodeURIComponent(appId)}/insights`,
    );
    return data;
  }

  async getAnalytics(
    appId: string,
    params: AppAnalyticsParams,
  ): Promise<ServiceResponse<AppAnalyticsPoint[]>> {
    const query = { ...params };
    const { data } = await api.get<ServiceResponse<AppAnalyticsPoint[]>>(
      `/v1/apps/${encodeURIComponent(appId)}/analytics`,
      { params: query },
    );
    return data;
  }

  async syncUpstream(appId: string): Promise<ServiceResponse<SyncUpstreamResponse>> {
    const { data } = await api.post<ServiceResponse<SyncUpstreamResponse>>(
      `/v1/apps/${encodeURIComponent(appId)}/sync-upstream`,
    );
    return data;
  }
}

export const appsRemoteDataSource: AppsRemoteDataSource = new AppsRemoteDataSourceImpl();


