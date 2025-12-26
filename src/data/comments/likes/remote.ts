import { api } from '../../../core/services/http';
import { BaseRemote } from '../../base-remote';
import type { ServiceResponse } from '../../types';
import type {
  AppCommentLikeList,
  AppCommentLikeMutationResult,
  AppCommentLikeStatsResult,
  CreateAppCommentLikeInput,
  ListAppCommentLikesQuery,
} from './types';

export interface AppCommentLikesRemoteDataSource {
  list(
    appId: string,
    commentId: string,
    query?: ListAppCommentLikesQuery
  ): Promise<ServiceResponse<AppCommentLikeList>>;
  create(
    appId: string,
    commentId: string,
    payload: CreateAppCommentLikeInput
  ): Promise<ServiceResponse<AppCommentLikeMutationResult>>;
  removeById(
    appId: string,
    commentId: string,
    likeId: string
  ): Promise<ServiceResponse<AppCommentLikeStatsResult>>;
  removeMine(appId: string, commentId: string): Promise<ServiceResponse<AppCommentLikeStatsResult>>;
}

class AppCommentLikesRemoteDataSourceImpl
  extends BaseRemote
  implements AppCommentLikesRemoteDataSource
{
  async list(
    appId: string,
    commentId: string,
    query?: ListAppCommentLikesQuery
  ): Promise<ServiceResponse<AppCommentLikeList>> {
    const params = query ? { ...query } : undefined;
    const { data } = await api.get<ServiceResponse<AppCommentLikeList>>(
      `/v1/apps/${encodeURIComponent(appId)}/comments/${encodeURIComponent(commentId)}/likes`,
      { params }
    );
    return data;
  }

  async create(
    appId: string,
    commentId: string,
    payload: CreateAppCommentLikeInput
  ): Promise<ServiceResponse<AppCommentLikeMutationResult>> {
    const { data } = await api.post<ServiceResponse<AppCommentLikeMutationResult>>(
      `/v1/apps/${encodeURIComponent(appId)}/comments/${encodeURIComponent(commentId)}/likes`,
      payload
    );
    return data;
  }

  async removeById(
    appId: string,
    commentId: string,
    likeId: string
  ): Promise<ServiceResponse<AppCommentLikeStatsResult>> {
    const { data } = await api.delete<ServiceResponse<AppCommentLikeStatsResult>>(
      `/v1/apps/${encodeURIComponent(appId)}/comments/${encodeURIComponent(commentId)}/likes/${encodeURIComponent(
        likeId
      )}`
    );
    return data;
  }

  async removeMine(
    appId: string,
    commentId: string
  ): Promise<ServiceResponse<AppCommentLikeStatsResult>> {
    const { data } = await api.delete<ServiceResponse<AppCommentLikeStatsResult>>(
      `/v1/apps/${encodeURIComponent(appId)}/comments/${encodeURIComponent(commentId)}/likes/me`
    );
    return data;
  }
}

export const appCommentLikesRemoteDataSource: AppCommentLikesRemoteDataSource =
  new AppCommentLikesRemoteDataSourceImpl();


