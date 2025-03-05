import { Construct } from "constructs";
import * as codedeploy from "aws-cdk-lib/aws-codedeploy";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import {
    GithubActionsIdentityProvider,
    GithubActionsRole,
} from "aws-cdk-github-oidc";
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

        const oidcProxy = GithubActionsIdentityProvider.fromAccount(
            this,
            "GithubOIDCProviderProxy",
        );

        const artifactsBucketProxy = s3.Bucket.fromBucketName(
            this,
            "ArtifactsBucketProxy",
            "chaeri-codedeploy-artifacts",
        );

        const actionsRole = new GithubActionsRole(this, "ActionsCodeDeployRole", {
            owner: props.githubRepo.owner,
            repo: props.githubRepo.repo,
            provider: oidcProxy,
            filter: `environment:${props.codedeployGitHubEnv}`,
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
