import type { BundlesRemoteDataSource } from './remote';
import { bundlesRemoteDataSource } from './remote';
import type { Bundle, InitiateBundleRequest } from './types';
import { BaseRepository } from '../../base-repository';

export interface BundlesRepository {
  initiate(appId: string, payload: InitiateBundleRequest): Promise<Bundle>;
  getById(appId: string, bundleId: string): Promise<Bundle>;
  getSignedDownloadUrl(appId: string, bundleId: string, options?: { redirect?: boolean }): Promise<{ url: string; redirect: boolean }>;
  getSignedAssetsDownloadUrl(
    appId: string,
    bundleId: string,
    options?: { redirect?: boolean; kind?: string }
  ): Promise<{ url: string; redirect: boolean }>;
}

class BundlesRepositoryImpl extends BaseRepository implements BundlesRepository {
  constructor(private readonly remote: BundlesRemoteDataSource) {
    super();
  }

  async initiate(appId: string, payload: InitiateBundleRequest): Promise<Bundle> {
    const res = await this.remote.initiate(appId, payload);
    return this.unwrapOrThrow(res);
  }

  async getById(appId: string, bundleId: string): Promise<Bundle> {
    const res = await this.remote.getById(appId, bundleId);
    return this.unwrapOrThrow(res);
  }

  async getSignedDownloadUrl(appId: string, bundleId: string, options?: { redirect?: boolean }): Promise<{ url: string; redirect: boolean }> {
    const res = await this.remote.getSignedDownloadUrl(appId, bundleId, options);
    return this.unwrapOrThrow(res);
  }

  async getSignedAssetsDownloadUrl(
    appId: string,
    bundleId: string,
    options?: { redirect?: boolean; kind?: string }
  ): Promise<{ url: string; redirect: boolean }> {
    const res = await this.remote.getSignedAssetsDownloadUrl(appId, bundleId, options);
    return this.unwrapOrThrow(res);
  }
}

export const bundlesRepository: BundlesRepository = new BundlesRepositoryImpl(bundlesRemoteDataSource);


