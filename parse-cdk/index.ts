import * as core from "@actions/core";
import { readFile } from "node:fs/promises";

async function run() {
    try {
        const path = core.getInput("file", { required: true });
        const file = await readFile(path, "utf-8");
        const data = JSON.parse(file);

        const keys = Object.keys(data);

        if (keys.length !== 1) {
            throw new Error(
                `Expected exactly 1 stack, but got ${keys.length}: ${keys.join()}`,
            );
        }

        const stackName = keys[0];
        core.info(`Stack name: ${stackName}`);
        core.setOutput("stack-name", stackName);

        core.info("Stack outputs:");
        for (const [key, value] of Object.entries(data[stackName])) {
            core.info(`  ${key} = ${value}`);
            core.setOutput(key, value);
        }
    } catch (error: any) {
        core.setFailed(error.message);
    }
}

run();
