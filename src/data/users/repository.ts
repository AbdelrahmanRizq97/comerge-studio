import type { UsersRemoteDataSource } from './remote';
import { usersRemoteDataSource } from './remote';
import type { UserStats, UserStatsBatchResponse } from './types';
import { BaseRepository } from '../../data/base-repository';

export interface UsersRepository {
  getStats(userId: string): Promise<UserStats>;
  getStatsBatch(userIds: string[]): Promise<Record<string, UserStats>>;
}

class UsersRepositoryImpl extends BaseRepository implements UsersRepository {
  constructor(private readonly remote: UsersRemoteDataSource) {
    super();
  }

  async getStats(userId: string): Promise<UserStats> {
    const res = await this.remote.getStats(userId);
    return this.unwrapOrThrow(res);
  }

  async getStatsBatch(userIds: string[]): Promise<Record<string, UserStats>> {
    if (userIds.length === 0) return {};
    const res = await this.remote.getStatsBatch(userIds);
    if (res.responseObject && !res.success) {
      return this.extractStats(res.responseObject);
    }
    const payload = this.unwrapOrThrow(res);
    return this.extractStats(payload);
  }

  private extractStats(payload: UserStatsBatchResponse): Record<string, UserStats> {
    const result: Record<string, UserStats> = {};
    Object.entries(payload.stats).forEach(([userId, stats]) => {
      if (stats) {
        result[userId] = stats;
      }
    });
    return result;
  }
}

export const usersRepository: UsersRepository = new UsersRepositoryImpl(usersRemoteDataSource);



