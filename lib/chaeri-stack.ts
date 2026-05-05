import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import {
    GithubActionsIdentityProvider,
    GithubActionsRole,
} from "aws-cdk-github-oidc";
import { GitHubEnvRepository } from "./types";

interface ChaeriStackProps extends cdk.StackProps {
    repos: GitHubEnvRepository[];
}

export class ChaeriStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ChaeriStackProps) {
        super(scope, id, props);

        const provider = new GithubActionsIdentityProvider(this, "GithubProvider");

        const instanceUser = new iam.User(this, "OracleCodeDeployInstanceUser");

        const instanceRole = new iam.Role(this, "OracleCodeDeployInstanceRole", {
            assumedBy: instanceUser,
        });
        instanceRole.grantAssumeRole(instanceUser);

        const artifactsBucket = new s3.Bucket(this, "CodeDeployArtifacts", {
            bucketName: "chaeri-codedeploy-artifacts",
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        artifactsBucket.grantRead(instanceRole);

        const cdkRoleProxy = iam.Role.fromRoleArn(
            this,
            "CDKRoleProxy",
            `arn:aws:iam::${this.account}:role/cdk-*`,
        );

        props.repos.forEach(({ owner, repo, githubEnv }) => {
            const role = new GithubActionsRole(
                this,
                `ActionsCDKRole/${owner}/${repo}`,
                {
                    provider,
                    owner,
                    repo,
                    filter: `environment:${githubEnv}`,
                    roleName: `ActionsCDK@${owner}+${repo}`,
                },
            );
            cdkRoleProxy.grantAssumeRole(role);
        });

        new cdk.CfnOutput(this, "CodeDeployArtifactsBucketName", {
            value: artifactsBucket.bucketName,
        });
    }
}
