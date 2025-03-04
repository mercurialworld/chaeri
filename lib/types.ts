export interface GitHubRepository {
    owner: string;
    repo: string;
}

export interface GitHubEnvRepository extends GitHubRepository {
    githubEnv: string;
}

export function getRepoFromEnv(): GitHubRepository {
    const repoName = process.env.GITHUB_REPOSITORY;

    if (repoName === undefined) {
        throw new Error(
            "GITHUB_REPOSITORY not found (is this being run from a GitHub Action?)",
        );
    }

    const [owner, repo] = repoName.split("/");

    return { owner, repo };
}
