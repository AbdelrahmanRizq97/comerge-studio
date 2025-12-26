import { api } from '../../core/services/http';
import type { ServiceResponse } from '../types';
import { BaseRemote } from '../base-remote';
import type { HomeSection, HomeSummary } from './types';

export interface HomeRemoteDataSource {
  getSummary(): Promise<ServiceResponse<HomeSummary>>;
  getSections(): Promise<ServiceResponse<HomeSection[]>>;
}

class HomeRemoteDataSourceImpl extends BaseRemote implements HomeRemoteDataSource {
  async getSummary(): Promise<ServiceResponse<HomeSummary>> {
    const { data } = await api.get<ServiceResponse<HomeSummary>>('/v1/home/summary');
    return data;
  }

  async getSections(): Promise<ServiceResponse<HomeSection[]>> {
    const { data } = await api.get<ServiceResponse<HomeSection[]>>('/v1/home/sections');
    return data;
  }
}

export const homeRemoteDataSource: HomeRemoteDataSource = new HomeRemoteDataSourceImpl();

