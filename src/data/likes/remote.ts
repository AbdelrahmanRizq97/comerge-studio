import { api } from '../../core/services/http';
import type { ServiceResponse } from '../types';
import { BaseRemote } from '../base-remote';
import type {
  AppLikeList,
  AppLikeMutationResult,
  AppLikeStatsResult,
  CreateAppLikeInput,
  ListAppLikesQuery,
} from './types';

export interface AppLikesRemoteDataSource {
  list(appId: string, query?: ListAppLikesQuery): Promise<ServiceResponse<AppLikeList>>;
  create(appId: string, payload: CreateAppLikeInput): Promise<ServiceResponse<AppLikeMutationResult>>;
  removeById(appId: string, likeId: string): Promise<ServiceResponse<AppLikeStatsResult>>;
  removeMine(appId: string): Promise<ServiceResponse<AppLikeStatsResult>>;
}

class AppLikesRemoteDataSourceImpl extends BaseRemote implements AppLikesRemoteDataSource {
  async list(appId: string, query?: ListAppLikesQuery): Promise<ServiceResponse<AppLikeList>> {
    const params = query ? { ...query } : undefined;
    const { data } = await api.get<ServiceResponse<AppLikeList>>(
      `/v1/apps/${encodeURIComponent(appId)}/likes`,
      { params }
    );
    return data;
  }

  async create(
    appId: string,
    payload: CreateAppLikeInput
  ): Promise<ServiceResponse<AppLikeMutationResult>> {
    const { data } = await api.post<ServiceResponse<AppLikeMutationResult>>(
      `/v1/apps/${encodeURIComponent(appId)}/likes`,
      payload
    );
    return data;
  }

  async removeById(appId: string, likeId: string): Promise<ServiceResponse<AppLikeStatsResult>> {
    const { data } = await api.delete<ServiceResponse<AppLikeStatsResult>>(
      `/v1/apps/${encodeURIComponent(appId)}/likes/${encodeURIComponent(likeId)}`
    );
    return data;
  }

  async removeMine(appId: string): Promise<ServiceResponse<AppLikeStatsResult>> {
    const { data } = await api.delete<ServiceResponse<AppLikeStatsResult>>(
      `/v1/apps/${encodeURIComponent(appId)}/likes/me`
    );
    return data;
  }
}

export const appLikesRemoteDataSource: AppLikesRemoteDataSource = new AppLikesRemoteDataSourceImpl();


