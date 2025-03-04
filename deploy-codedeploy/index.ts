import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as github from "@actions/github";
import {
    BundleType,
    CodeDeployClient,
    CreateDeploymentCommand,
    CreateDeploymentCommandInput,
} from "@aws-sdk/client-codedeploy";

async function run() {
    try {
        const path = core.getInput("path", { required: true });
        const stack = core.getInput("stack", { required: true });
        const application = core.getInput("application", { required: true });
        const deploymentGroup = core.getInput("deployment-group", {
            required: true,
        });
        const s3Bucket = "chaeri-codedeploy-artifacts";

        const s3Key = `${stack}/${github.context.sha}.zip`;
        const codedeployClient = new CodeDeployClient();

        // Upload deployment bundle to S3
        core.info("Uploading deployment bundle to S3...");
        await exec.exec("aws", [
            "deploy",
            "push",
            `--application-name=${application}`,
            `--s3-location=s3://${s3Bucket}/${s3Key}`,
            `--source=${path}`,
        ]);

        // Create CodeDeploy deployment
        const deploymentParams: CreateDeploymentCommandInput = {
            applicationName: application,
            deploymentGroupName: deploymentGroup,
            revision: {
                s3Location: {
                    bucket: s3Bucket,
                    key: s3Key,
                    bundleType: BundleType.Zip,
                },
            },
        };

        core.info("Creating CodeDeploy deployment...");
        const command = new CreateDeploymentCommand(deploymentParams);

        const { deploymentId } = await codedeployClient.send(command);
        const deploymentURL = `https://${process.env.AWS_REGION}.console.aws.amazon.com/codesuite/codedeploy/deployments/${deploymentId}?region=${process.env.AWS_REGION}`;

        core.info(`Deployment URL: ${deploymentURL}`);

        core.setOutput("s3-key", s3Key);
        core.setOutput("deployment-id", deploymentId);
        core.setOutput("deployment-url", deploymentURL);

        // Wait for deployment to finish
        core.info("Waiting for deployment to finish...");
        await exec.exec("aws", [
            "deploy",
            "wait",
            "deployment-successful",
            `--deployment-id=${deploymentId}`,
        ]);

        core.info("this probably successfully deployed");
    } catch (error: any) {
        core.setFailed(error.message);
    }
}

run();
