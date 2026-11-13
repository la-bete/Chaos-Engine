import fs from "fs";
import os from "os";
import path from "path";
import { format } from "util";
import CLI from "../../src/classes/CLI";

let dir: string;
let logs: string[];

function write(name: string, contents: string) {
    fs.writeFileSync(path.join(dir, name), contents);
    return path.join(dir, name);
}

function writeConfig(config: string) {
    return write(
        `chaos.config.${Math.random().toString(36).slice(2)}.js`,
        `module.exports = ${config};`
    );
}

const output = () => logs.join("\n");

describe("CLI", () => {
    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), "chaos-cli-"));
        logs = [];
        jest.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
            logs.push(format(...args));
        });
        write("sum.js", "module.exports = (a, b) => a + b;");
        write(
            "asyncSum.js",
            "module.exports = async (a, b) => { if (a === -1) throw new Error('neg'); return a + b; };"
        );
        write("esm.js", "exports.default = (a) => a;");
        write(
            "odd.js",
            "module.exports = (n) => { const o = { n }; o.self = o; return n === null ? 10n : n === undefined ? () => n : o; };"
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it("runs a config without errorLevel or destructives", async () => {
        const config = writeConfig(
            `{ files: { "sum.js": { inputs: [2, 3] } } }`
        );
        await expect(CLI.init(config)).resolves.toBeUndefined();
        expect(output()).toContain("Starting tests on SUM.JS");
        expect(output()).not.toContain("Invalid error level");
    });

    it("compares a falsy expected output such as 0", async () => {
        const config = writeConfig(
            `{ files: { "sum.js": { inputs: [0, 0], output: 0 } } }`
        );
        await CLI.init(config);
        expect(output()).toContain("MatchedReturnType");
    });

    it("applies global destructives to files without their own", async () => {
        const config = writeConfig(
            `{ destructives: { number: ["GLOBAL_MARKER"] }, files: { "sum.js": { inputs: [1, 2] } } }`
        );
        await CLI.init(config);
        expect(output()).toContain("GLOBAL_MARKER");
    });

    it("lets a file set errorLevel 0 over a global 1", async () => {
        const config = writeConfig(
            `{ errorLevel: 1, files: { "sum.js": { inputs: [], errorLevel: 0 } } }`
        );
        await expect(CLI.init(config)).rejects.toThrow(
            "Invalid inputs passed in for file 'sum.js'"
        );
    });

    it("logs and continues at errorLevel 1", async () => {
        const config = writeConfig(
            `{ errorLevel: 1, files: { "missing.js": { inputs: [1] }, "sum.js": { inputs: [1, 2] } } }`
        );
        await expect(CLI.init(config)).resolves.toBeUndefined();
        expect(output()).toContain("Failed to import missing.js");
        expect(output()).toContain("Starting tests on SUM.JS");
    });

    it("rejects instead of leaving an unhandled rejection at errorLevel 0", async () => {
        const config = writeConfig(
            `{ files: { "missing.js": { inputs: [1] } } }`
        );
        await expect(CLI.init(config)).rejects.toThrow(
            "Failed to import missing.js"
        );
    });

    it("handles async modules and default exports", async () => {
        const config = writeConfig(
            `{ files: { "asyncSum.js": { inputs: [1, 2], output: 3 }, "esm.js": { inputs: ["a"] } } }`
        );
        await CLI.init(config);
        expect(output()).toContain('ERROR: "neg"');
        expect(output()).toContain("Starting tests on ESM.JS");
        expect(output()).not.toContain("does not export a function");
    });

    it("rejects when the config cannot be loaded or is invalid", async () => {
        await expect(CLI.init(path.join(dir, "nope.js"))).rejects.toThrow(
            "Failed to parse config"
        );
        await expect(CLI.init(writeConfig(`{ files: 1 }`))).rejects.toThrow(
            "Config Files property is not an object"
        );
    });

    it("prints a table even when outputs cannot be serialised as JSON", async () => {
        const config = writeConfig(`{ files: { "odd.js": { inputs: [2] } } }`);
        await expect(CLI.init(config)).resolves.toBeUndefined();
        expect(output()).not.toContain("Failed to log to table");
        expect(output()).toContain("[Circular");
        expect(output()).toContain("10n");
        expect(output()).toContain("[Function");
    });
});
