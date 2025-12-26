import type { AppRatingsRemoteDataSource } from './remote';
import { appRatingsRemoteDataSource } from './remote';
import type {
  AppRating,
  AppRatingList,
  AppRatingMutationResult,
  AppRatingStatsResult,
  CreateAppRatingInput,
  ListAppRatingsQuery,
  UpdateAppRatingInput,
} from './types';
import { BaseRepository } from '../../data/base-repository';

export interface AppRatingsRepository {
  list(appId: string, query?: ListAppRatingsQuery): Promise<AppRatingList>;
  getById(appId: string, ratingId: string): Promise<AppRating>;
  create(appId: string, payload: CreateAppRatingInput): Promise<AppRatingMutationResult>;
  update(
    appId: string,
    ratingId: string,
    payload: UpdateAppRatingInput
  ): Promise<AppRatingMutationResult>;
  remove(appId: string, ratingId: string): Promise<AppRatingStatsResult>;
}

class AppRatingsRepositoryImpl extends BaseRepository implements AppRatingsRepository {
  constructor(private readonly remote: AppRatingsRemoteDataSource) {
    super();
  }

  async list(appId: string, query?: ListAppRatingsQuery): Promise<AppRatingList> {
    const res = await this.remote.list(appId, query);
    return this.unwrapOrThrow(res);
  }

  async getById(appId: string, ratingId: string): Promise<AppRating> {
    const res = await this.remote.getById(appId, ratingId);
    return this.unwrapOrThrow(res);
  }

  async create(appId: string, payload: CreateAppRatingInput): Promise<AppRatingMutationResult> {
    const res = await this.remote.create(appId, payload);
    return this.unwrapOrThrow(res);
  }

  async update(
    appId: string,
    ratingId: string,
    payload: UpdateAppRatingInput
  ): Promise<AppRatingMutationResult> {
    const res = await this.remote.update(appId, ratingId, payload);
    return this.unwrapOrThrow(res);
  }

  async remove(appId: string, ratingId: string): Promise<AppRatingStatsResult> {
    const res = await this.remote.remove(appId, ratingId);
    return this.unwrapOrThrow(res);
  }
}

export const appRatingsRepository: AppRatingsRepository = new AppRatingsRepositoryImpl(appRatingsRemoteDataSource);


