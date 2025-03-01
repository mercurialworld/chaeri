import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { GithubActionsIdentityProvider } from "aws-cdk-github-oidc";

export class ChaeriStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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

        new cdk.CfnOutput(this, "CodeDeployArtifactsBucketName", {
            value: artifactsBucket.bucketName,
        });
    }
}

interface ChaeriStackProps extends cdk.StackProps {
    repos: GitHubRepository[];
}

interface GitHubRepository {
    owner: string;
    repo: string;
}
