import { api } from '../../core/services/http';
import type { ServiceResponse } from '../types';
import { BaseRemote } from '../base-remote';
import type { MeProfile } from './types';

export interface MeRemoteDataSource {
  getMe(): Promise<ServiceResponse<MeProfile>>;
  setExpoPushToken(expoPushToken: string): Promise<ServiceResponse<{ expoPushToken: string }>>;
}

class MeRemoteDataSourceImpl extends BaseRemote implements MeRemoteDataSource {
  async getMe(): Promise<ServiceResponse<MeProfile>> {
    const { data } = await api.get<ServiceResponse<MeProfile>>('/v1/me');
    return data;
  }

  async setExpoPushToken(expoPushToken: string): Promise<ServiceResponse<{ expoPushToken: string }>> {
    const { data } = await api.post<ServiceResponse<{ expoPushToken: string }>>(
      '/v1/me/expo-push-token',
      { expoPushToken }
    );
    return data;
  }
}

export const meRemoteDataSource: MeRemoteDataSource = new MeRemoteDataSourceImpl();


