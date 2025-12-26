export type GithubOAuthStart = {
  url: string;
};

export type GithubRepo = {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch?: string;
  ownerLogin?: string | null;
};

export type GithubReposResponse = {
  repositories: {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    default_branch?: string;
    owner?: { login?: string | null };
  }[];
};
