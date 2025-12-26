import type { AppLikesRemoteDataSource } from './remote';
import { appLikesRemoteDataSource } from './remote';
import type {
  AppLikeList,
  AppLikeMutationResult,
  AppLikeStatsResult,
  CreateAppLikeInput,
  ListAppLikesQuery,
} from './types';
import { BaseRepository } from '../../data/base-repository';

export interface AppLikesRepository {
  list(appId: string, query?: ListAppLikesQuery): Promise<AppLikeList>;
  create(appId: string, payload: CreateAppLikeInput): Promise<AppLikeMutationResult>;
  removeById(appId: string, likeId: string): Promise<AppLikeStatsResult>;
  removeMine(appId: string): Promise<AppLikeStatsResult>;
}

class AppLikesRepositoryImpl extends BaseRepository implements AppLikesRepository {
  constructor(private readonly remote: AppLikesRemoteDataSource) {
    super();
  }

  async list(appId: string, query?: ListAppLikesQuery): Promise<AppLikeList> {
    const res = await this.remote.list(appId, query);
    return this.unwrapOrThrow(res);
  }

  async create(appId: string, payload: CreateAppLikeInput): Promise<AppLikeMutationResult> {
    const res = await this.remote.create(appId, payload);
    return this.unwrapOrThrow(res);
  }

  async removeById(appId: string, likeId: string): Promise<AppLikeStatsResult> {
    const res = await this.remote.removeById(appId, likeId);
    return this.unwrapOrThrow(res);
  }

  async removeMine(appId: string): Promise<AppLikeStatsResult> {
    const res = await this.remote.removeMine(appId);
    return this.unwrapOrThrow(res);
  }
}

export const appLikesRepository: AppLikesRepository = new AppLikesRepositoryImpl(appLikesRemoteDataSource);


