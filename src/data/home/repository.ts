import type { HomeRemoteDataSource } from './remote';
import { homeRemoteDataSource } from './remote';
import type { HomeSection, HomeSummary } from './types';
import { BaseRepository } from '../../data/base-repository';

export interface HomeRepository {
  getSummary(): Promise<HomeSummary>;
  getSections(): Promise<HomeSection[]>;
}

class HomeRepositoryImpl extends BaseRepository implements HomeRepository {
  constructor(private readonly remote: HomeRemoteDataSource) {
    super();
  }

  async getSummary(): Promise<HomeSummary> {
    const res = await this.remote.getSummary();
    return this.unwrapOrThrow(res);
  }

  async getSections(): Promise<HomeSection[]> {
    const res = await this.remote.getSections();
    return this.unwrapOrThrow(res);
  }
}

export const homeRepository: HomeRepository = new HomeRepositoryImpl(homeRemoteDataSource);

