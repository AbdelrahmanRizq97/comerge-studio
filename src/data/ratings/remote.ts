import { api } from '../../core/services/http';
import type { ServiceResponse } from '../types';
import { BaseRemote } from '../base-remote';
import type {
  AppRating,
  AppRatingList,
  AppRatingMutationResult,
  AppRatingStatsResult,
  CreateAppRatingInput,
  ListAppRatingsQuery,
  UpdateAppRatingInput,
} from './types';

export interface AppRatingsRemoteDataSource {
  list(appId: string, query?: ListAppRatingsQuery): Promise<ServiceResponse<AppRatingList>>;
  getById(appId: string, ratingId: string): Promise<ServiceResponse<AppRating>>;
  create(appId: string, payload: CreateAppRatingInput): Promise<ServiceResponse<AppRatingMutationResult>>;
  update(
    appId: string,
    ratingId: string,
    payload: UpdateAppRatingInput
  ): Promise<ServiceResponse<AppRatingMutationResult>>;
  remove(appId: string, ratingId: string): Promise<ServiceResponse<AppRatingStatsResult>>;
}

class AppRatingsRemoteDataSourceImpl extends BaseRemote implements AppRatingsRemoteDataSource {
  async list(appId: string, query?: ListAppRatingsQuery): Promise<ServiceResponse<AppRatingList>> {
    const params = query ? { ...query } : undefined;
    const { data } = await api.get<ServiceResponse<AppRatingList>>(
      `/v1/apps/${encodeURIComponent(appId)}/ratings`,
      { params }
    );
    return data;
  }

  async getById(appId: string, ratingId: string): Promise<ServiceResponse<AppRating>> {
    const { data } = await api.get<ServiceResponse<AppRating>>(
      `/v1/apps/${encodeURIComponent(appId)}/ratings/${encodeURIComponent(ratingId)}`
    );
    return data;
  }

  async create(
    appId: string,
    payload: CreateAppRatingInput
  ): Promise<ServiceResponse<AppRatingMutationResult>> {
    const { data } = await api.post<ServiceResponse<AppRatingMutationResult>>(
      `/v1/apps/${encodeURIComponent(appId)}/ratings`,
      payload
    );
    return data;
  }

  async update(
    appId: string,
    ratingId: string,
    payload: UpdateAppRatingInput
  ): Promise<ServiceResponse<AppRatingMutationResult>> {
    const { data } = await api.patch<ServiceResponse<AppRatingMutationResult>>(
      `/v1/apps/${encodeURIComponent(appId)}/ratings/${encodeURIComponent(ratingId)}`,
      payload
    );
    return data;
  }

  async remove(appId: string, ratingId: string): Promise<ServiceResponse<AppRatingStatsResult>> {
    const { data } = await api.delete<ServiceResponse<AppRatingStatsResult>>(
      `/v1/apps/${encodeURIComponent(appId)}/ratings/${encodeURIComponent(ratingId)}`
    );
    return data;
  }
}

export const appRatingsRemoteDataSource: AppRatingsRemoteDataSource = new AppRatingsRemoteDataSourceImpl();


