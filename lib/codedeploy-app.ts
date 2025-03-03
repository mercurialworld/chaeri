import { Construct } from "constructs";
import * as codedeploy from "aws-cdk-lib/aws-codedeploy";
import * as iam from "aws-cdk-lib/aws-iam";
import {
    GithubActionsIdentityProvider,
    GithubActionsRole,
} from "aws-cdk-github-oidc";
import { GitHubRepository } from "./types";
import * as cdk from "aws-cdk-lib";

export interface CodeDeployAppProps {
    githubRepo: GitHubRepository;
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

        const actionsRole = new GithubActionsRole(this, "ActionsCodeDeployRole", {
            owner: props.githubRepo.owner,
            repo: props.githubRepo.repo,
            provider: oidcProxy,
            filter: `environment:${props.githubRepo.githubEnv}`,
        });

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
            value: application.applicationName,
        });

        new cdk.CfnOutput(this, "DeploymentGroupName", {
            value: deploymentGroup.deploymentGroupName,
        });

        new cdk.CfnOutput(this, "ActionsCodeDeployRoleARN", {
            value: actionsRole.roleArn,
        });
    }
}
