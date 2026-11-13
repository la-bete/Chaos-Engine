/** @type {import("jest").Config} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    clearMocks: true,
    testMatch: ["<rootDir>/tests/**/*.test.ts"],
    collectCoverageFrom: ["src/**/*.ts", "!src/cli.ts"],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "json-summary"],
    // CI fails if coverage drops below these
    coverageThreshold: { global: { statements: 90, branches: 80, functions: 95, lines: 90 } }
};
