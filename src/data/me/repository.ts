import type { MeRemoteDataSource } from './remote';
import { meRemoteDataSource } from './remote';
import type { MeProfile } from './types';
import { BaseRepository } from '../../data/base-repository';

export interface MeRepository {
  getMe(): Promise<MeProfile>;
  setExpoPushToken(expoPushToken: string): Promise<string>;
}

class MeRepositoryImpl extends BaseRepository implements MeRepository {
  constructor(private readonly remote: MeRemoteDataSource) {
    super();
  }

  async getMe(): Promise<MeProfile> {
    const res = await this.remote.getMe();
    return this.unwrapOrThrow(res);
  }

  async setExpoPushToken(expoPushToken: string): Promise<string> {
    const res = await this.remote.setExpoPushToken(expoPushToken);
    const out = this.unwrapOrThrow(res);
    return out.expoPushToken;
  }
}

export const meRepository: MeRepository = new MeRepositoryImpl(meRemoteDataSource);


