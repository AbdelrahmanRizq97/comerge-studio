import { BaseRepository } from '../../base-repository';
import type { AppCommentLikesRemoteDataSource } from './remote';
import { appCommentLikesRemoteDataSource } from './remote';
import type {
  AppCommentLikeList,
  AppCommentLikeMutationResult,
  AppCommentLikeStatsResult,
  CreateAppCommentLikeInput,
  ListAppCommentLikesQuery,
} from './types';

export interface AppCommentLikesRepository {
  list(appId: string, commentId: string, query?: ListAppCommentLikesQuery): Promise<AppCommentLikeList>;
  create(
    appId: string,
    commentId: string,
    payload: CreateAppCommentLikeInput
  ): Promise<AppCommentLikeMutationResult>;
  removeById(appId: string, commentId: string, likeId: string): Promise<AppCommentLikeStatsResult>;
  removeMine(appId: string, commentId: string): Promise<AppCommentLikeStatsResult>;
}

class AppCommentLikesRepositoryImpl extends BaseRepository implements AppCommentLikesRepository {
  constructor(private readonly remote: AppCommentLikesRemoteDataSource) {
    super();
  }

  async list(appId: string, commentId: string, query?: ListAppCommentLikesQuery): Promise<AppCommentLikeList> {
    const res = await this.remote.list(appId, commentId, query);
    return this.unwrapOrThrow(res);
  }

  async create(
    appId: string,
    commentId: string,
    payload: CreateAppCommentLikeInput
  ): Promise<AppCommentLikeMutationResult> {
    const res = await this.remote.create(appId, commentId, payload);
    return this.unwrapOrThrow(res);
  }

  async removeById(
    appId: string,
    commentId: string,
    likeId: string
  ): Promise<AppCommentLikeStatsResult> {
    const res = await this.remote.removeById(appId, commentId, likeId);
    return this.unwrapOrThrow(res);
  }

  async removeMine(appId: string, commentId: string): Promise<AppCommentLikeStatsResult> {
    const res = await this.remote.removeMine(appId, commentId);
    return this.unwrapOrThrow(res);
  }
}

export const appCommentLikesRepository: AppCommentLikesRepository = new AppCommentLikesRepositoryImpl(
  appCommentLikesRemoteDataSource
);


