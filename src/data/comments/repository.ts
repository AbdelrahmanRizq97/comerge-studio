import type { AppCommentsRemoteDataSource } from './remote';
import { appCommentsRemoteDataSource } from './remote';
import type {
  AppComment,
  AppCommentList,
  CreateAppCommentInput,
  ListAppCommentsQuery,
  UpdateAppCommentInput,
} from './types';
import { BaseRepository } from '../../data/base-repository';

export interface AppCommentsRepository {
  list(appId: string, query?: ListAppCommentsQuery): Promise<AppCommentList>;
  getById(appId: string, commentId: string): Promise<AppComment>;
  create(appId: string, payload: CreateAppCommentInput): Promise<AppComment>;
  update(appId: string, commentId: string, payload: UpdateAppCommentInput): Promise<AppComment>;
  remove(appId: string, commentId: string): Promise<AppComment>;
}

class AppCommentsRepositoryImpl extends BaseRepository implements AppCommentsRepository {
  constructor(private readonly remote: AppCommentsRemoteDataSource) {
    super();
  }

  async list(appId: string, query?: ListAppCommentsQuery): Promise<AppCommentList> {
    const res = await this.remote.list(appId, query);
    return this.unwrapOrThrow(res);
  }

  async getById(appId: string, commentId: string): Promise<AppComment> {
    const res = await this.remote.getById(appId, commentId);
    return this.unwrapOrThrow(res);
  }

  async create(appId: string, payload: CreateAppCommentInput): Promise<AppComment> {
    const res = await this.remote.create(appId, payload);
    return this.unwrapOrThrow(res);
  }

  async update(appId: string, commentId: string, payload: UpdateAppCommentInput): Promise<AppComment> {
    const res = await this.remote.update(appId, commentId, payload);
    return this.unwrapOrThrow(res);
  }

  async remove(appId: string, commentId: string): Promise<AppComment> {
    const res = await this.remote.remove(appId, commentId);
    return this.unwrapOrThrow(res);
  }
}

export const appCommentsRepository: AppCommentsRepository = new AppCommentsRepositoryImpl(appCommentsRemoteDataSource);


