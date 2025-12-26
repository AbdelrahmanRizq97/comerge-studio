import { BaseRepository } from '../../data/base-repository';
import type { GithubRemoteDataSource } from './remote';
import { githubRemoteDataSource } from './remote';
import type { GithubOAuthStart, GithubRepo, GithubReposResponse } from './types';

export interface GithubRepository {
  getOAuthUrl(): Promise<GithubOAuthStart>;
  listRepos(): Promise<GithubRepo[]>;
}

class GithubRepositoryImpl extends BaseRepository implements GithubRepository {
  constructor(private readonly remote: GithubRemoteDataSource) {
    super();
  }

  async getOAuthUrl(): Promise<GithubOAuthStart> {
    const res = await this.remote.getOAuthUrl();
    return this.unwrapOrThrow(res);
  }

  async listRepos(): Promise<GithubRepo[]> {
    const res = await this.remote.listRepos();
    const payload = this.unwrapOrThrow(res) as GithubReposResponse;
    return (payload.repositories || []).map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      defaultBranch: repo.default_branch,
      ownerLogin: repo.owner?.login ?? null,
    }));
  }
}

export const githubRepository: GithubRepository = new GithubRepositoryImpl(githubRemoteDataSource);
