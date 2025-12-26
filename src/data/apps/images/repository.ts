import type {
  AppImageSignedUrlBatchResponse,
  AppImagesRemoteDataSource,
  GetAppImageSignedUrlOptions,
} from './remote';
import { appImagesRemoteDataSource } from './remote';
import { BaseRepository } from '../../base-repository';

export interface AppImagesRepository {
  getSignedUrl(
    appId: string,
    options?: GetAppImageSignedUrlOptions
  ): Promise<{ url: string; redirect: boolean }>;
  getSignedUrlsBatch(
    appIds: string[],
    options?: Pick<GetAppImageSignedUrlOptions, 'variant'>
  ): Promise<AppImageSignedUrlBatchResponse>;
}

class AppImagesRepositoryImpl extends BaseRepository implements AppImagesRepository {
  constructor(private readonly remote: AppImagesRemoteDataSource) {
    super();
  }

  async getSignedUrl(
    appId: string,
    options?: GetAppImageSignedUrlOptions
  ): Promise<{ url: string; redirect: boolean }> {
    const res = await this.remote.getSignedUrl(appId, options);
    return this.unwrapOrThrow(res);
  }

  async getSignedUrlsBatch(
    appIds: string[],
    options?: Pick<GetAppImageSignedUrlOptions, 'variant'>
  ): Promise<AppImageSignedUrlBatchResponse> {
    const res = await this.remote.getSignedUrlsBatch(appIds, options);
    if (res.responseObject && !res.success) {
      return res.responseObject;
    }
    return this.unwrapOrThrow(res);
  }
}

export const appImagesRepository: AppImagesRepository = new AppImagesRepositoryImpl(appImagesRemoteDataSource);


