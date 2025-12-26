import type { MergeRequestsRemoteDataSource } from './remote';
import { mergeRequestsRemoteDataSource } from './remote';
import type {
  MergeRequest,
  MergeRequestStatus,
  MergeRequestsByStatus,
  OpenMergeRequestRequest,
  UpdateMergeRequestRequest,
} from './types';
import { BaseRepository } from '../../data/base-repository';

export interface MergeRequestsRepository {
  list(params: { sourceAppId?: string; targetAppId?: string; status?: MergeRequestStatus }): Promise<MergeRequest[]>;
  listByStatuses(params: {
    sourceAppId?: string;
    targetAppId?: string;
    statuses: MergeRequestStatus[];
  }): Promise<MergeRequestsByStatus>;
  open(payload: OpenMergeRequestRequest): Promise<MergeRequest>;
  getById(mrId: string): Promise<MergeRequest>;
  update(mrId: string, payload: UpdateMergeRequestRequest): Promise<MergeRequest>;
}

class MergeRequestsRepositoryImpl extends BaseRepository implements MergeRequestsRepository {
  constructor(private readonly remote: MergeRequestsRemoteDataSource) {
    super();
  }

  async list(params: { sourceAppId?: string; targetAppId?: string; status?: MergeRequestStatus }): Promise<MergeRequest[]> {
    const res = await this.remote.list(params);
    return this.unwrapOrThrow(res);
  }

  async listByStatuses(params: {
    sourceAppId?: string;
    targetAppId?: string;
    statuses: MergeRequestStatus[];
  }): Promise<MergeRequestsByStatus> {
    if (!params.statuses || params.statuses.length === 0) return {};
    const res = await this.remote.listByStatuses(params);
    const payload = this.unwrapOrThrow(res);
    if (Array.isArray(payload)) {
      return { [params.statuses[0]]: payload };
    }
    return payload;
  }

  async open(payload: OpenMergeRequestRequest): Promise<MergeRequest> {
    const res = await this.remote.open(payload);
    return this.unwrapOrThrow(res);
  }

  async getById(mrId: string): Promise<MergeRequest> {
    const res = await this.remote.getById(mrId);
    return this.unwrapOrThrow(res);
  }

  async update(mrId: string, payload: UpdateMergeRequestRequest): Promise<MergeRequest> {
    const res = await this.remote.update(mrId, payload);
    return this.unwrapOrThrow(res);
  }
}

export const mergeRequestsRepository: MergeRequestsRepository = new MergeRequestsRepositoryImpl(mergeRequestsRemoteDataSource);


