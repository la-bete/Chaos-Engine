/** @type {import("jest").Config} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    clearMocks: true,
    testMatch: ["<rootDir>/tests/**/*.test.ts"],
    collectCoverageFrom: ["src/**/*.ts", "!src/cli.ts"],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov"]
};
