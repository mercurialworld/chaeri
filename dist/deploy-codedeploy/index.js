'use strict';

Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core = tslib_1.__importStar(require("@actions/core"));
const exec = tslib_1.__importStar(require("@actions/exec"));
const github = tslib_1.__importStar(require("@actions/github"));
const client_codedeploy_1 = require("@aws-sdk/client-codedeploy");
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
        const codedeployClient = new client_codedeploy_1.CodeDeployClient();
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
        const deploymentParams = {
            applicationName: application,
            deploymentGroupName: deploymentGroup,
            revision: {
                s3Location: {
                    bucket: s3Bucket,
                    key: s3Key,
                    bundleType: client_codedeploy_1.BundleType.Zip,
                },
            },
        };
        core.info("Creating CodeDeploy deployment...");
        const command = new client_codedeploy_1.CreateDeploymentCommand(deploymentParams);
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
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
run();
//# sourceMappingURL=index.js.map
