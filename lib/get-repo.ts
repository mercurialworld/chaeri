import { GitHubRepository } from "./types";

export interface RepoProps {
    withID: boolean
}

export function getRepoFromEnv({withID}: RepoProps): GitHubRepository {
    const repoName = process.env.GITHUB_REPOSITORY;

    if (repoName === undefined) {
        throw new Error(
            "GITHUB_REPOSITORY not found (is this being run from a GitHub Action?)",
        );
    }

    const [owner, repo] = repoName.split("/");
    let ownerId = null;
    let repoId = null;

    if (withID) {
        ownerId = process.env.GITHUB_REPOSITORY_OWNER_ID
        repoId = process.env.GITHUB_REPOSITORY_ID     
    }

    return { owner, repo, ownerId, repoId };
}
