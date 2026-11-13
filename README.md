# Chaos-Engine

[![codecov](https://codecov.io/gh/La-BeTe/Chaos-Engine/branch/master/graph/badge.svg?token=npPIcAYD8F)](https://codecov.io/gh/La-BeTe/Chaos-Engine)

A small edge-case testing library and CLI for JavaScript functions. You give it one example of each argument, and it calls the function again and again with each argument swapped for awkward values of the same type (`NaN`, `Infinity`, empty and whitespace strings, `null`, `undefined`, wrong types), then reports what each call returned, what threw, and how long it took. It is a quick way to see how a function behaves at the edges without writing those cases by hand.

## Tech stack

- TypeScript
- Node.js
- yargs
- cli-table3
- Jest
- Babel

## How it works

- Each argument example passed to `toTake` gets a type, either given or deduced (`string`, `number`, `boolean`, `object`, or a nested object shape).
- For each argument in turn, the engine keeps the other arguments at their examples and substitutes every built-in destructive value for that type, plus the `generals` values (`null`, `undefined`).
- For object arguments, each property is also replaced one at a time, recursively.
- You can add your own destructive values per type, or define custom types.
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

Async functions work too: `run()` detects them, or call `runAsync()` explicitly, which returns a promise of the same result.

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
        // Path relative to the config file; the module must export a function
        "sum.js": {
            inputs: [2, 3],
            output: 5
        }
    }
};
```

Each file's results are printed as a table of inputs, output, time taken and, when `output` is set, whether the return type matched.

## Documentation

The full API (`setFn`, `setErrorLevel`, `setDestructives`, `toTake`, `toReturn`, `run`, `runAsync`, `refresh`), custom types, and every CLI config option are in [docs/API.md](docs/API.md).

## Next steps

- Move CI from Travis (`.travis.yml`, pinned to Node 14) to GitHub Actions, running the Jest suite and the Codecov upload on current Node LTS versions.

## License

MIT
