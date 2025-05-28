export interface GitHubRepository {
    owner: string;
    repo: string;
}

export interface GitHubEnvRepository extends GitHubRepository {
    githubEnv: string;
}
