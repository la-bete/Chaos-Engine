import path from "path";
import Table from "cli-table3";
import Engine, { Result } from "./Engine";
import { throwError, errorMessage } from "./Error";
import { isValidObject } from "../helpers/utilities";

interface Config {
    files: {
        [x: string]: {
            inputs: unknown[];
            output?: unknown;
            errorLevel?: 0 | 1;
            destructives?: {
                [x: string]: unknown[];
            };
        };
    };
    errorLevel?: 0 | 1;
    destructives?: {
        [y: string]: unknown[];
    };
}

export default class CLI extends Engine {
    private constructor(
        private readonly config: Config,
        private readonly configLocation = ""
    ) {
        super();
    }

    get files() {
        return this.config && this.config.files;
    }

    private log(...args: unknown[]) {
        return console.log("\n", ...args);
    }

    private validateConfig() {
        if (!isValidObject(this.config)) throwError("Config is not an object");
        if (!isValidObject(this.files))
            throwError("Config Files property is not an object");
        this.log("Successfully validated configuration options");
    }

    private async startTests() {
        // Files run one after another so their output does not interleave
        for (const [name, file] of Object.entries(this.files)) {
            await this.testHandler({ name, file });
        }
    }

    private async testHandler({
        name: fileName,
        file
    }: {
        name: string;
        file: Config["files"]["x"];
    }): Promise<void> {
        this.log(`Starting tests on ${path.basename(fileName).toUpperCase()}`);
        // Until the file's own settings are applied, report with the global level
        this.setErrorLevel(this.config.errorLevel ?? 0);
        let fn: unknown;
        try {
            const configDir = path.dirname(this.configLocation);
            const fileLocation = path.resolve(configDir, fileName);
            const mod = require(fileLocation);
            // Accept `module.exports = fn` as well as a default export
            fn = typeof mod === "function" ? mod : mod?.default;
        } catch (e) {
            return void this.sendError(
                `Failed to import ${fileName}, \nCaught error: ${errorMessage(e)}`
            );
        }
        if (typeof fn !== "function")
            return void this.sendError(
                `The file ${path.basename(fileName)} does not export a function`
            );
        if (!isValidObject(file))
            return void this.sendError(
                `The ${fileName} property in the config is not an object`
            );

        // setFn resets the engine, so the error level and destructives are
        // applied after it: file settings first, then the global fallbacks.
        this.setFn(fn);
        this.setErrorLevel(file.errorLevel ?? this.config.errorLevel ?? 0);
        const result: { [x: string]: unknown[] } = {
            ...(this.config.destructives ?? {})
        };
        const destructives = file.destructives ?? {};
        for (const each in destructives) {
            const arr = destructives[each];
            if (Array.isArray(arr))
                result[each] = [...arr, ...(result[each] || [])];
            else
                this.sendError(
                    `Expected an array for each destructive property, got '${JSON.stringify(
                        arr
                    )}'`
                );
        }
        this.setDestructives(result);

        const args = file.inputs;
        if (!args || !Array.isArray(args) || args.length < 1)
            return void this.sendError(
                `Invalid inputs passed in for file '${fileName}'`
            );
        for (const arg of args) {
            if (Array.isArray(arg) && arg.length === 2)
                this.toTake(arg[0], arg[1]);
            else this.toTake(arg);
        }
        if (file.output !== undefined) {
            const arg = file.output;
            if (Array.isArray(arg) && arg.length === 2)
                this.toReturn(arg[0], arg[1]);
            else this.toReturn(arg);
        }
        const outcome = await this.run();
        if (outcome.data) {
            const errorLogging = this.buildTable(outcome.data);
            if (errorLogging !== "")
                this.sendError(
                    `Failed to log to table, \nCaught error: ${errorLogging}`
                );
        } else if (outcome.message) {
            this.sendError(outcome.message);
        }
    }

    private buildTable(results: Result[]) {
        try {
            const headings: string[] = [];
            Object.keys(results[0]).forEach((str) => {
                let normStr = str.replace(str[0], str[0].toUpperCase());
                if (normStr !== "Error") {
                    headings.push(normStr);
                }
            });
            const table = new Table({
                head: [...headings],
                chars: {
                    top: "═",
                    "top-mid": "╤",
                    "top-left": "╔",
                    "top-right": "╗",
                    bottom: "═",
                    "bottom-mid": "╧",
                    "bottom-left": "╚",
                    "bottom-right": "╝",
                    left: "║",
                    "left-mid": "╟",
                    mid: "─",
                    "mid-mid": "┼",
                    right: "║",
                    "right-mid": "╢",
                    middle: "│"
                }
            });
            for (const result of results) {
                const entries: any[] = [];
                Object.keys(result).forEach((entry) => {
                    //@ts-ignore
                    const value = result[entry];
                    let jsonEntry = (
                        JSON.stringify(value, (key, value) => {
                            if (value !== value) {
                                return "NaN";
                            }

                            if (value === Infinity) {
                                return "Infinity";
                            }
                            if (value === undefined) {
                                return "undefined";
                            }
                            if (value === -Infinity) {
                                return "-Infinity";
                            }
                            return value;
                        }) ?? String(value)
                    ).slice(0, 80);
                    if (entry.toLowerCase() === "output" && result.error) {
                        jsonEntry = `ERROR: ${jsonEntry}`;
                    }
                    if (entry.toLowerCase() !== "error")
                        entries.push(jsonEntry);
                });
                table.push([...entries]);
            }
            this.log(table.toString());
            return "";
        } catch (e) {
            return errorMessage(e);
        }
    }

    /** Loads the config file and runs every file in it, in order. */
    static async init(configLocation: string) {
        let config: Config;
        try {
            config = require(path.resolve(configLocation));
        } catch (e) {
            return throwError(
                `Failed to parse config from ${configLocation}, \nCaught error: ${errorMessage(e)}`,
                e instanceof Error ? e.stack : undefined
            );
        }
        const cli = new CLI(config, configLocation);
        cli.validateConfig();
        await cli.startTests();
    }
}
