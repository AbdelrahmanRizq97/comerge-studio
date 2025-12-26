import { api } from '../../core/services/http';
import type { ServiceResponse } from '../types';
import { BaseRemote } from '../base-remote';
import type {
  MergeRequest,
  MergeRequestStatus,
  MergeRequestsByStatus,
  OpenMergeRequestRequest,
  UpdateMergeRequestRequest,
} from './types';

export interface MergeRequestsRemoteDataSource {
  list(params: { sourceAppId?: string; targetAppId?: string; status?: MergeRequestStatus }): Promise<ServiceResponse<MergeRequest[]>>;
  listByStatuses(params: {
    sourceAppId?: string;
    targetAppId?: string;
    statuses: MergeRequestStatus[];
  }): Promise<ServiceResponse<MergeRequestsByStatus | MergeRequest[]>>;
  open(payload: OpenMergeRequestRequest): Promise<ServiceResponse<MergeRequest>>;
  getById(mrId: string): Promise<ServiceResponse<MergeRequest>>;
  update(mrId: string, payload: UpdateMergeRequestRequest): Promise<ServiceResponse<MergeRequest>>;
}

class MergeRequestsRemoteDataSourceImpl extends BaseRemote implements MergeRequestsRemoteDataSource {
  async list(params: { sourceAppId?: string; targetAppId?: string; status?: MergeRequestStatus }): Promise<ServiceResponse<MergeRequest[]>> {
    const query: Record<string, string> = {};
    if (params.sourceAppId) query.sourceAppId = params.sourceAppId;
    if (params.targetAppId) query.targetAppId = params.targetAppId;
    if (params.status) query.status = params.status;
    const { data } = await api.get<ServiceResponse<MergeRequest[]>>('/v1/merge-requests', { params: query });
    return data;
  }

  async listByStatuses(params: {
    sourceAppId?: string;
    targetAppId?: string;
    statuses: MergeRequestStatus[];
  }): Promise<ServiceResponse<MergeRequestsByStatus | MergeRequest[]>> {
    const query: Record<string, string | string[]> = {};
    if (params.sourceAppId) query.sourceAppId = params.sourceAppId;
    if (params.targetAppId) query.targetAppId = params.targetAppId;
    query.status = params.statuses;
    const { data } = await api.get<ServiceResponse<MergeRequestsByStatus | MergeRequest[]>>(
      '/v1/merge-requests',
      {
        params: query,
        paramsSerializer: {
          indexes: null,
        },
      }
    );
    return data;
  }

  async open(payload: OpenMergeRequestRequest): Promise<ServiceResponse<MergeRequest>> {
    const { data } = await api.post<ServiceResponse<MergeRequest>>('/v1/merge-requests', payload);
    return data;
  }

  async getById(mrId: string): Promise<ServiceResponse<MergeRequest>> {
    const { data } = await api.get<ServiceResponse<MergeRequest>>(`/v1/merge-requests/${encodeURIComponent(mrId)}`);
    return data;
  }

  async update(mrId: string, payload: UpdateMergeRequestRequest): Promise<ServiceResponse<MergeRequest>> {
    const { data } = await api.patch<ServiceResponse<MergeRequest>>(
      `/v1/merge-requests/${encodeURIComponent(mrId)}`,
      payload
    );
    return data;
  }
}

export const mergeRequestsRemoteDataSource: MergeRequestsRemoteDataSource = new MergeRequestsRemoteDataSourceImpl();


