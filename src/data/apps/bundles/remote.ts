import { api } from '../../../core/services/http';
import type { ServiceResponse } from '../../types';
import { BaseRemote } from '../../base-remote';
import type { Bundle, InitiateBundleRequest } from './types';

export interface BundlesRemoteDataSource {
  initiate(appId: string, payload: InitiateBundleRequest): Promise<ServiceResponse<Bundle>>;
  getById(appId: string, bundleId: string): Promise<ServiceResponse<Bundle>>;
  getSignedDownloadUrl(
    appId: string,
    bundleId: string,
    options?: { redirect?: boolean }
  ): Promise<ServiceResponse<{ url: string; redirect: boolean }>>;
  getSignedAssetsDownloadUrl(
    appId: string,
    bundleId: string,
    options?: { redirect?: boolean; kind?: string }
  ): Promise<ServiceResponse<{ url: string; redirect: boolean }>>;
}

class BundlesRemoteDataSourceImpl extends BaseRemote implements BundlesRemoteDataSource {
  async initiate(appId: string, payload: InitiateBundleRequest): Promise<ServiceResponse<Bundle>> {
    const { data } = await api.post<ServiceResponse<Bundle>>(
      `/v1/apps/${encodeURIComponent(appId)}/bundles`,
      payload
    );
    return data;
  }

  async getById(appId: string, bundleId: string): Promise<ServiceResponse<Bundle>> {
    const { data } = await api.get<ServiceResponse<Bundle>>(
      `/v1/apps/${encodeURIComponent(appId)}/bundles/${encodeURIComponent(bundleId)}`
    );
    return data;
  }

  async getSignedDownloadUrl(
    appId: string,
    bundleId: string,
    options?: { redirect?: boolean }
  ): Promise<ServiceResponse<{ url: string; redirect: boolean }>> {
    const { data } = await api.get<ServiceResponse<{ url: string; redirect: boolean }>>(
      `/v1/apps/${encodeURIComponent(appId)}/bundles/${encodeURIComponent(bundleId)}/download`,
      { params: { redirect: options?.redirect ?? false } }
    );
    return data;
  }

  async getSignedAssetsDownloadUrl(
    appId: string,
    bundleId: string,
    options?: { redirect?: boolean; kind?: string }
  ): Promise<ServiceResponse<{ url: string; redirect: boolean }>> {
    const { data } = await api.get<ServiceResponse<{ url: string; redirect: boolean }>>(
      `/v1/apps/${encodeURIComponent(appId)}/bundles/${encodeURIComponent(bundleId)}/assets/download`,
      { params: { redirect: options?.redirect ?? false, kind: options?.kind } }
    );
    return data;
  }
}

export const bundlesRemoteDataSource: BundlesRemoteDataSource = new BundlesRemoteDataSourceImpl();


