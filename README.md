# Chaos-Engine

[![CI](https://github.com/la-bete/chaos-engine/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/la-bete/chaos-engine/actions/workflows/ci.yml)

A small edge-case testing library and CLI for JavaScript functions. You give it one example of each argument, and it calls the function again and again with each argument swapped for awkward values of the same type (`NaN`, `Infinity`, empty and whitespace strings, `null`, `undefined`, wrong types), then reports what each call returned, what threw, and how long it took. It is a quick way to see how a function behaves at the edges without writing those cases by hand.

## Tech stack

- TypeScript
- Node.js
- yargs
- cli-table3
- Jest
- GitHub Actions

## How it works

- Each argument example passed to `toTake` gets a type, either given or deduced (`string`, `number`, `boolean`, `object`, or a nested object shape).
- For each argument in turn, the engine keeps the other arguments at their examples and substitutes every built-in destructive value for that type, plus the `generals` values (`null`, `undefined`).
- For object arguments, each property is also replaced one at a time, recursively.
- You can add your own destructive values per type, or define custom types. They apply inside union types and nested objects too.
- If `toReturn` is given, each result also records whether the output matched the expected return type.

Built-in destructive values (from `src/helpers/utilities.ts`):

| Type       | Values                                                   |
| ---------- | -------------------------------------------------------- |
| `string`   | `""`, `"   "`, `"13467"`, `[]`                           |
| `number`   | `-1`, `Infinity`, `-Infinity`, `NaN`, `10007199254740992` |
| `boolean`  | `1`, `0`, `""`, `[]`                                     |
| `object`   | `{}`, `[]`, `{ destroy: "24" }`, `2000000000000000000`   |
| `generals` | `null`, `undefined` (used for every argument)            |

## Installation

Requires Node.js 20 or later.

```
$ npm install @la-bete/chaos-engine
```

## Basic usage

```javascript
import { chaos } from "@la-bete/chaos-engine";

function sum(a, b) {
    return a + b;
}

const result = chaos(sum)
    .toTake(4, "number")
    .toTake(4, "number")
    .toReturn(8, "number")
    .run();

// result.status === "success"
// result.data is one entry per call:
// { inputs, output, error, timeTaken, matchedReturnType }
```

Async functions work with the same calls. `run()` returns a promise as soon as any call returns one, and `runAsync()` always returns a promise. A rejected promise is recorded as an error for that call. The function is never called before `run()` or `runAsync()`.

```javascript
const result = await chaos(async (id) => fetchUser(id)).toTake(42).runAsync();
```

## CLI

Install globally and describe the functions to test in a `chaos.config.js`:

```
$ npm install @la-bete/chaos-engine -g
$ chaos                              # reads ./chaos.config.js
$ chaos --config=path/to/config.js   # or a custom config file
```

```javascript
// chaos.config.js
module.exports = {
    files: {
        // Path relative to the config file. The module must export a function
        // (module.exports = fn, or a default export).
        "sum.js": {
            inputs: [2, 3],
            output: 5
        }
    }
};
```

Each file's results are printed as a table of inputs, output, time taken and, when `output` is set, whether the return type matched. If a configuration problem is thrown (error level `0`, the default), `chaos` stops and exits with code 1.

## Documentation

The full API (`setFn`, `setErrorLevel`, `setDestructives`, `toTake`, `toReturn`, `run`, `runAsync`, `refresh`), custom types, and every CLI config option are in [docs/API.md](docs/API.md).

## Upgrading from 1.x

2.0.0 fixes several bugs, and some of the fixes change results. See [CHANGELOG.md](CHANGELOG.md) for the full list.

- **Node.js 20 or later** is required.
- **`setFn` no longer calls your function.** In 1.x it called it once with no arguments to guess whether it was async. If you relied on that call, call the function yourself.
- **`run()` returns a promise whenever any call returns one**, not only when that first probe call did. Code that used `run()` with a function that only sometimes returns a promise should `await` the result, or use `runAsync()`.
- **Successful async calls now have `error: false`.** In 1.x every async call was reported as an error.
- **`matchedReturnType` is always set after `toReturn`**, including when the expected value is falsy (`0`, `""`, `false`), and is `false` for every call that threw or rejected.
- **Custom destructives now reach union types and nested object properties**, so the same setup can produce more calls than before.
- **Deep imports are no longer available.** The package has an `exports` map, so import from `@la-bete/chaos-engine` only, not from `lib/...`.
- **CLI:** a per-file `errorLevel: 0` and falsy `output` values are now honoured; global `errorLevel` and `destructives` apply to every file; unknown flags are rejected; and a thrown error exits with code 1.

## License

MIT

## Releasing

1. Bump `version` in `package.json` (and add a `CHANGELOG.md` entry) in a pull request, and merge it.
2. Publish a GitHub Release whose tag is that version with a `v` in front, e.g. `gh release create v1.2.3 --generate-notes`.
3. The `Release` workflow checks the tag matches `package.json`, builds, tests and publishes to npm, with provenance.

CI fails if test coverage drops below the floor set in `jest.config.js`; each CI run shows the coverage table in its summary.
