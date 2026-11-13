# Changelog

## 2.0.0

### Breaking changes

- Node.js 20 or later is required (`engines.node` is `>=20`). The library is compiled to ES2022.
- `package.json` now has an `exports` map. Only the package root (`@la-bete/chaos-engine`) and `@la-bete/chaos-engine/package.json` can be imported; deep imports such as `@la-bete/chaos-engine/lib/classes/Engine` no longer resolve.
- `setFn` no longer calls the function under test. In 1.x it called it once with no arguments to detect async functions, which ran side effects and misdetected functions that throw without arguments.
- `run()` now decides at run time: it returns the results directly when every call returned synchronously, and a promise as soon as any call returned a promise. In 1.x this depended on the probe call above, so a non-async function that returned a promise could get unresolved promises as outputs.
- Successful async calls are reported with `error: false`. In 1.x every async call had `error: true`.
- `matchedReturnType` is set on every result once `toReturn` has been called, based on the expected type rather than the truthiness of the expected value. Expected values such as `0`, `""` and `false` are now compared on async failures too, and any call that threw or rejected has `matchedReturnType: false`.
- Custom destructives are passed to union type members and nested object properties. In 1.x only the top level used them, so the same setup can now produce more calls.
- CLI: global `errorLevel` and `destructives` apply to every file. In 1.x `setFn` reset them, so they were lost unless the file also had its own `destructives`.
- CLI: a per-file `errorLevel: 0` now overrides a global `1`, and falsy `output` values (`0`, `""`, `false`) are used as the expected return.
- CLI: unknown command-line flags are rejected, and an error thrown while loading or running a config makes `chaos` exit with code 1 (it used to be an unhandled promise rejection).
- `ChaosError` instances have `name` set to `"ChaosError"`.

### Fixed

- A CLI config without `errorLevel` or `destructives` no longer logs "Invalid error level" or fails validation at error level 0.
- Type checks against an object shape return `false` for `null` or non-object values instead of throwing.
- The CLI's result table no longer fails on values `JSON.stringify` cannot serialise, such as functions.
- `npm run build` works on a fresh install. The old `compile` script failed with current `@types/node` and deleted `lib/` first, so a publish would have shipped an empty package.

### Added

- The CLI accepts modules with a default export as well as `module.exports = fn`.
- Exported types: `Options`, `Result`, `TestResults`, `UserDestructives`, `Engine`, and the `ChaosError` class.

### Tooling

- TypeScript 5.9 (strict), Jest 30 with ts-jest, `@types/node` 22. Babel and ts-node removed.
- `build`, `typecheck` and `prepublishOnly` (build and test) scripts; `push:publish` removed.
- `package-lock.json` is committed.
- GitHub Actions CI on Node 20 and 22 replaces Travis CI, with coverage uploaded to Codecov.
- Tests for the CLI, async results, falsy expected returns and nested custom destructives.
