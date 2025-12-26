import { api } from '../../core/services/http';
import { BaseRemote } from '../base-remote';
import type { ServiceResponse } from '../types';
import type { GithubOAuthStart, GithubReposResponse } from './types';

export interface GithubRemoteDataSource {
  getOAuthUrl(): Promise<ServiceResponse<GithubOAuthStart>>;
  listRepos(): Promise<ServiceResponse<GithubReposResponse>>;
}

class GithubRemoteDataSourceImpl extends BaseRemote implements GithubRemoteDataSource {
  async getOAuthUrl(): Promise<ServiceResponse<GithubOAuthStart>> {
    const { data } = await api.get<ServiceResponse<GithubOAuthStart>>('/v1/github/oauth/start');
    return data;
  }

  async listRepos(): Promise<ServiceResponse<GithubReposResponse>> {
    const { data } = await api.get<ServiceResponse<GithubReposResponse>>('/v1/github/repos');
    return data;
  }
}

export const githubRemoteDataSource: GithubRemoteDataSource = new GithubRemoteDataSourceImpl();
