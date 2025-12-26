import { api } from '../../core/services/http';
import type { ServiceResponse } from '../types';
import { BaseRemote } from '../base-remote';
import type { Thread, UpdateThreadRequest } from './types';

export interface ThreadsRemoteDataSource {
  list(): Promise<ServiceResponse<Thread[]>>;
  getById(threadId: string): Promise<ServiceResponse<Thread>>;
  update(threadId: string, payload: UpdateThreadRequest): Promise<ServiceResponse<Thread>>;
  delete(threadId: string): Promise<ServiceResponse<never>>;
}

class ThreadsRemoteDataSourceImpl extends BaseRemote implements ThreadsRemoteDataSource {
  async list(): Promise<ServiceResponse<Thread[]>> {
    const { data } = await api.get<ServiceResponse<Thread[]>>('/v1/threads');
    return data;
  }

  async getById(threadId: string): Promise<ServiceResponse<Thread>> {
    const { data } = await api.get<ServiceResponse<Thread>>(`/v1/threads/${encodeURIComponent(threadId)}`);
    return data;
  }

  async update(threadId: string, payload: UpdateThreadRequest): Promise<ServiceResponse<Thread>> {
    const { data } = await api.patch<ServiceResponse<Thread>>(
      `/v1/threads/${encodeURIComponent(threadId)}`,
      payload
    );
    return data;
  }

  async delete(threadId: string): Promise<ServiceResponse<never>> {
    const { data } = await api.delete<ServiceResponse<never>>(`/v1/threads/${encodeURIComponent(threadId)}`);
    return data;
  }
}

export const threadsRemoteDataSource: ThreadsRemoteDataSource = new ThreadsRemoteDataSourceImpl();


