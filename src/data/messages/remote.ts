import { api } from '../../core/services/http';
import type { ServiceResponse } from '../types';
import type { Message } from './types';
import { BaseRemote } from '../base-remote';

export interface MessagesRemoteDataSource {
  list(threadId: string): Promise<ServiceResponse<Message[]>>;
}

class MessagesRemoteDataSourceImpl extends BaseRemote implements MessagesRemoteDataSource {
  async list(threadId: string): Promise<ServiceResponse<Message[]>> {
    const { data } = await api.get<ServiceResponse<Message[]>>(
      `/v1/threads/${encodeURIComponent(threadId)}/messages`
    );
    return data;
  }
}

export const messagesRemoteDataSource: MessagesRemoteDataSource = new MessagesRemoteDataSourceImpl();


