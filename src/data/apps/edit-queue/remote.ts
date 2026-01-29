import { api } from '../../../core/services/http';
import type { ServiceResponse } from '../../types';
import { BaseRemote } from '../../base-remote';
import type { EditQueueItem, EditQueueListResponse, UpdateEditQueueItemRequest } from './types';

export interface EditQueueRemoteDataSource {
  list(appId: string): Promise<ServiceResponse<EditQueueListResponse>>;
  update(
    appId: string,
    queueItemId: string,
    payload: UpdateEditQueueItemRequest
  ): Promise<ServiceResponse<EditQueueItem>>;
  cancel(appId: string, queueItemId: string): Promise<ServiceResponse<EditQueueItem>>;
}

class EditQueueRemoteDataSourceImpl extends BaseRemote implements EditQueueRemoteDataSource {
  async list(appId: string): Promise<ServiceResponse<EditQueueListResponse>> {
    const { data } = await api.get<ServiceResponse<EditQueueListResponse>>(
      `/v1/apps/${encodeURIComponent(appId)}/edit-queue`
    );
    return data;
  }

  async update(
    appId: string,
    queueItemId: string,
    payload: UpdateEditQueueItemRequest
  ): Promise<ServiceResponse<EditQueueItem>> {
    const { data } = await api.patch<ServiceResponse<EditQueueItem>>(
      `/v1/apps/${encodeURIComponent(appId)}/edit-queue/${encodeURIComponent(queueItemId)}`,
      payload
    );
    return data;
  }

  async cancel(appId: string, queueItemId: string): Promise<ServiceResponse<EditQueueItem>> {
    const { data } = await api.delete<ServiceResponse<EditQueueItem>>(
      `/v1/apps/${encodeURIComponent(appId)}/edit-queue/${encodeURIComponent(queueItemId)}`
    );
    return data;
  }
}

export const editQueueRemoteDataSource: EditQueueRemoteDataSource =
  new EditQueueRemoteDataSourceImpl();
