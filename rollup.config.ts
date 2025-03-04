import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";

import { RollupOptions } from "rollup";

const config: RollupOptions[] = [
    {
        input: "deploy-codedeploy/index.ts",
        output: {
            esModule: true,
            file: "dist/deploy-codedeploy/index.js",
            format: "cjs",
            sourcemap: true,
        },
        plugins: [
            typescript({ outDir: "dist/deploy-codedeploy" }),
            nodeResolve({ preferBuiltins: true }),
            json(),
            commonjs(),
        ],
    },
    {
        input: "parse-cdk/index.ts",
        output: {
            esModule: true,
            file: "dist/parse-cdk/index.js",
            format: "cjs",
            sourcemap: true,
        },
        plugins: [
            typescript({ outDir: "dist/parse-cdk" }),
            nodeResolve({ preferBuiltins: true }),
            json(),
            commonjs(),
        ],
    },
];

export default config;
