#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ChaeriStack } from "../lib/chaeri-stack";

const app = new cdk.App();
new ChaeriStack(app, "ChaeriStack", {
    env: { account: "575108959833", region: "us-east-1" },
    repos: [
        { owner: "mercurialworld", repo: "chaeri", githubEnv: "aws-cdk" },
        { owner: "mercurialworld", repo: "mafuyu", githubEnv: "aws-cdk" },
        { owner: "mercurialworld", repo: "pochasite", githubEnv: "aws-cdk" },
    ],
});
