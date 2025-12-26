import { api } from '../../../core/services/http';
import type { ServiceResponse } from '../../types';
import { BaseRemote } from '../../base-remote';

export type GetAppImageSignedUrlOptions = {
  variant?: string;
  redirect?: boolean;
};

export type AppImageSignedUrlBatchResponse = {
  urls: Record<string, string | null>;
  errors?: Record<string, { message: string; statusCode: number }>;
};

export interface AppImagesRemoteDataSource {
  getSignedUrl(
    appId: string,
    options?: GetAppImageSignedUrlOptions
  ): Promise<ServiceResponse<{ url: string; redirect: boolean }>>;
  getSignedUrlsBatch(
    appIds: string[],
    options?: Pick<GetAppImageSignedUrlOptions, 'variant'>
  ): Promise<ServiceResponse<AppImageSignedUrlBatchResponse>>;
}

class AppImagesRemoteDataSourceImpl extends BaseRemote implements AppImagesRemoteDataSource {
  async getSignedUrl(
    appId: string,
    options?: GetAppImageSignedUrlOptions
  ): Promise<ServiceResponse<{ url: string; redirect: boolean }>> {
    const { data } = await api.get<ServiceResponse<{ url: string; redirect: boolean }>>(
      `/v1/apps/${encodeURIComponent(appId)}/image/url`,
      {
        params: {
          variant: options?.variant,
          redirect: options?.redirect ?? false,
        },
      }
    );
    return data;
  }

  async getSignedUrlsBatch(
    appIds: string[],
    options?: Pick<GetAppImageSignedUrlOptions, 'variant'>
  ): Promise<ServiceResponse<AppImageSignedUrlBatchResponse>> {
    const payload = {
      appIds,
      variant: options?.variant,
    };
    const { data } = await api.post<ServiceResponse<AppImageSignedUrlBatchResponse>>(
      '/v1/apps/image/url/batch',
      payload
    );
    return data;
  }
}

export const appImagesRemoteDataSource: AppImagesRemoteDataSource = new AppImagesRemoteDataSourceImpl();


