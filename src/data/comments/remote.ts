import { api } from '../../core/services/http';
import type { ServiceResponse } from '../types';
import { BaseRemote } from '../base-remote';
import type {
  AppComment,
  AppCommentList,
  CreateAppCommentInput,
  ListAppCommentsQuery,
  UpdateAppCommentInput,
} from './types';

export interface AppCommentsRemoteDataSource {
  list(appId: string, query?: ListAppCommentsQuery): Promise<ServiceResponse<AppCommentList>>;
  getById(appId: string, commentId: string): Promise<ServiceResponse<AppComment>>;
  create(appId: string, payload: CreateAppCommentInput): Promise<ServiceResponse<AppComment>>;
  update(
    appId: string,
    commentId: string,
    payload: UpdateAppCommentInput
  ): Promise<ServiceResponse<AppComment>>;
  remove(appId: string, commentId: string): Promise<ServiceResponse<AppComment>>;
}

class AppCommentsRemoteDataSourceImpl extends BaseRemote implements AppCommentsRemoteDataSource {
  async list(appId: string, query?: ListAppCommentsQuery): Promise<ServiceResponse<AppCommentList>> {
    const params = query ? { ...query } : undefined;
    const { data } = await api.get<ServiceResponse<AppCommentList>>(
      `/v1/apps/${encodeURIComponent(appId)}/comments`,
      { params }
    );
    return data;
  }

  async getById(appId: string, commentId: string): Promise<ServiceResponse<AppComment>> {
    const { data } = await api.get<ServiceResponse<AppComment>>(
      `/v1/apps/${encodeURIComponent(appId)}/comments/${encodeURIComponent(commentId)}`
    );
    return data;
  }

  async create(appId: string, payload: CreateAppCommentInput): Promise<ServiceResponse<AppComment>> {
    const { data } = await api.post<ServiceResponse<AppComment>>(
      `/v1/apps/${encodeURIComponent(appId)}/comments`,
      payload
    );
    return data;
  }

  async update(
    appId: string,
    commentId: string,
    payload: UpdateAppCommentInput
  ): Promise<ServiceResponse<AppComment>> {
    const { data } = await api.patch<ServiceResponse<AppComment>>(
      `/v1/apps/${encodeURIComponent(appId)}/comments/${encodeURIComponent(commentId)}`,
      payload
    );
    return data;
  }

  async remove(appId: string, commentId: string): Promise<ServiceResponse<AppComment>> {
    const { data } = await api.delete<ServiceResponse<AppComment>>(
      `/v1/apps/${encodeURIComponent(appId)}/comments/${encodeURIComponent(commentId)}`
    );
    return data;
  }
}

export const appCommentsRemoteDataSource: AppCommentsRemoteDataSource = new AppCommentsRemoteDataSourceImpl();


