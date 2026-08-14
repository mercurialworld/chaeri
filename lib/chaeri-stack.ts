import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import {
    EnvironmentFilter,
    GithubActionsIdentityProvider,
    GithubActionsRole,
} from "@blimmer/cdk-github-oidc";
import { GitHubEnvRepository } from "./types";

interface ChaeriStackProps extends cdk.StackProps {
    repos: GitHubEnvRepository[];
    servers: string[];
}

export class ChaeriStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ChaeriStackProps) {
        super(scope, id, props);

        const provider = new GithubActionsIdentityProvider(this, "GithubProvider");
        const artifactsBucket = new s3.Bucket(this, "CodeDeployArtifacts", {
            bucketName: "chaeri-codedeploy-artifacts",
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // i now have more than one server so this is required woohoo!
        for (const serverName of props.servers) {
            const instanceUser = new iam.User(this, `${serverName}CodeDeployInstanceUser`);

            const instanceRole = new iam.Role(this, `${serverName}CodeDeployInstanceRole`, {
                assumedBy: instanceUser,
            });

            instanceRole.grantAssumeRole(instanceUser);
            artifactsBucket.grantRead(instanceRole);
        }

        const cdkRoleProxy = iam.Role.fromRoleArn(
            this,
            "CDKRoleProxy",
            `arn:aws:iam::${this.account}:role/cdk-*`,
        );

        props.repos.forEach((r) => {
            const role = new GithubActionsRole(
                this,
                `ActionsCDKRole/${r.owner}/${r.repo}`,
                {
                    provider,
                    roleName: `ActionsCDK@${r.owner}+${r.repo}`,
                    subjectFilters: [ new EnvironmentFilter({
                        owner: r.owner,
                        ownerId: r.ownerId ?? undefined,
                        repository: r.repo,
                        repositoryId: r.repoId ?? undefined,
                        environment: r.githubEnv
                    })]
                },
            );
            cdkRoleProxy.grantAssumeRole(role);
        });

        new cdk.CfnOutput(this, "CodeDeployArtifactsBucketName", {
            value: artifactsBucket.bucketName,
        });
    }
}
