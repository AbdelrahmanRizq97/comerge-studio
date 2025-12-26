import type { ThreadsRemoteDataSource } from './remote';
import { threadsRemoteDataSource } from './remote';
import type { Thread, UpdateThreadRequest } from './types';
import { BaseRepository } from '../../data/base-repository';

export interface ThreadsRepository {
  list(): Promise<Thread[]>;
  getById(threadId: string): Promise<Thread>;
  update(threadId: string, payload: UpdateThreadRequest): Promise<Thread>;
  delete(threadId: string): Promise<void>;
}

class ThreadsRepositoryImpl extends BaseRepository implements ThreadsRepository {
  constructor(private readonly remote: ThreadsRemoteDataSource) {
    super();
  }

  async list(): Promise<Thread[]> {
    const res = await this.remote.list();
    return this.unwrapOrThrow(res);
  }

  async getById(threadId: string): Promise<Thread> {
    const res = await this.remote.getById(threadId);
    return this.unwrapOrThrow(res);
  }

  async update(threadId: string, payload: UpdateThreadRequest): Promise<Thread> {
    const res = await this.remote.update(threadId, payload);
    return this.unwrapOrThrow(res);
  }

  async delete(threadId: string): Promise<void> {
    const res = await this.remote.delete(threadId);
    this.unwrapOrThrow(res as any);
  }
}

export const threadsRepository: ThreadsRepository = new ThreadsRepositoryImpl(threadsRemoteDataSource);


