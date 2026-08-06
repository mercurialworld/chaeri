export interface GitHubRepository {
    owner: string;
    repo: string;
    ownerId?: string | null;
    repoId?: string | null;
}

export interface GitHubEnvRepository extends GitHubRepository {
    githubEnv: string;
}
