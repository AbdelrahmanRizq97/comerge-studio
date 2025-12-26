import { api } from '../../core/services/http';
import type { ServiceResponse } from '../types';
import { BaseRemote } from '../base-remote';
import type { UserStats, UserStatsBatchResponse } from './types';

export interface UsersRemoteDataSource {
  getStats(userId: string): Promise<ServiceResponse<UserStats>>;
  getStatsBatch(userIds: string[]): Promise<ServiceResponse<UserStatsBatchResponse>>;
}

class UsersRemoteDataSourceImpl extends BaseRemote implements UsersRemoteDataSource {
  async getStats(userId: string): Promise<ServiceResponse<UserStats>> {
    const { data } = await api.get<ServiceResponse<UserStats>>(
      `/v1/users/${encodeURIComponent(userId)}/stats`
    );
    return data;
  }

  async getStatsBatch(userIds: string[]): Promise<ServiceResponse<UserStatsBatchResponse>> {
    const { data } = await api.post<ServiceResponse<UserStatsBatchResponse>>(
      '/v1/users/stats/batch',
      { userIds }
    );
    return data;
  }
}

export const usersRemoteDataSource: UsersRemoteDataSource = new UsersRemoteDataSourceImpl();



