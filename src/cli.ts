#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import CLI from "./classes/CLI";
import { errorMessage } from "./classes/Error";

const argv = yargs(hideBin(process.argv))
    .scriptName("chaos")
    .usage("$0 [--config=path]")
    .option("config", {
        type: "string",
        default: "./chaos.config.js",
        describe: "Path to the config file"
    })
    .strict()
    .help()
    .parseSync();

CLI.init(argv.config).catch((e: unknown) => {
    console.error(errorMessage(e));
    process.exitCode = 1;
});
