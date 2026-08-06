import { Construct } from "constructs";
import * as codedeploy from "aws-cdk-lib/aws-codedeploy";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import {
    EnvironmentFilter,
    GithubActionsIdentityProvider,
    GithubActionsRole,
} from "@blimmer/cdk-github-oidc";
import { GitHubRepository } from "./types";
import * as cdk from "aws-cdk-lib";

export interface CodeDeployAppProps {
    githubRepo: GitHubRepository;
    codedeployGitHubEnv: string;
    onPremInstanceTag: string;
}

export class CodeDeployApp extends Construct {
    constructor(scope: Construct, id: string, props: CodeDeployAppProps) {
        super(scope, id);

        // CodeDeploy

        const application = new codedeploy.ServerApplication(this, "Application");

        const deploymentConfig = codedeploy.ServerDeploymentConfig.ONE_AT_A_TIME;

        const deploymentGroup = new codedeploy.ServerDeploymentGroup(
            this,
            "DeploymentGroup",
            {
                application,
                deploymentConfig: deploymentConfig,
                autoRollback: { failedDeployment: true },
                onPremiseInstanceTags: new codedeploy.InstanceTagSet({
                    instance: [props.onPremInstanceTag],
                }),
            },
        );

        // GH Actions

        const oidcProxy = GithubActionsIdentityProvider.fromAccount(this, {
            account: "GithubOIDCProviderProxy",
        });

        const artifactsBucketProxy = s3.Bucket.fromBucketName(
            this,
            "ArtifactsBucketProxy",
            "chaeri-codedeploy-artifacts",
        );

        const actionsRole = new GithubActionsRole(this, "ActionsCodeDeployRole", {
            provider: oidcProxy,
            subjectFilters: [
                new EnvironmentFilter({
                    owner: props.githubRepo.owner,
                    ownerId: props.githubRepo.ownerId ?? undefined,
                    repository: props.githubRepo.repo,
                    repositoryId: props.githubRepo.repoId ?? undefined,
                    environment: props.codedeployGitHubEnv,
                }),
            ],
        });

        artifactsBucketProxy.grantReadWrite(actionsRole);

        actionsRole.addToPolicy(
            new iam.PolicyStatement({
                actions: ["codedeploy:*"],
                resources: [
                    application.applicationArn,
                    deploymentGroup.deploymentGroupArn,
                    deploymentConfig.deploymentConfigArn,
                ],
            }),
        );

        // outputs

        new cdk.CfnOutput(this, "ApplicationName", {
            key: "ApplicationName",
            value: application.applicationName,
        });

        new cdk.CfnOutput(this, "DeploymentGroupName", {
            key: "DeploymentGroupName",
            value: deploymentGroup.deploymentGroupName,
        });

        new cdk.CfnOutput(this, "ActionsCodeDeployRoleARN", {
            key: "ActionsCodeDeployRoleARN",
            value: actionsRole.roleArn,
        });
    }
}
