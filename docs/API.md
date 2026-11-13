# Chaos-Engine API and CLI reference

Back to the [README](../README.md).

## API

### Notes

-   The `testFn` below refers to the function we are trying to run destructive tests on.
-   All methods except `runAsync` and `run` return the instance, so they can be chained

### chaos

`chaos` creates an Engine instance. It takes the function, error level and custom destructives either positionally or as one options object:

```javascript
chaos(sum, 1, { number: [0] });
chaos({ fn: sum, errorLevel: 1, destructives: { number: [0] } });
```

### setFn

The `setFn` method can be used to set the `testFn` associated with this Engine instance. It also calls the `refresh` method internally. You can also get the current `testFn` by accessing the `fn` property on the instance.

```javascript
const chaosEngine = chaos(); // chaosEngine.fn => undefined
chaosEngine.setFn(sum); // chaosEngine.fn => sum
```

### setErrorLevel

The `setErrorLevel` method can be used to set the `errorLevel`. This determines if encountered errors are thrown or logged. The default value is 0 and can only be set to 0 or 1. You can also get the current `errorLevel` by accessing the `errorLevel` property on the instance. An `errorLevel` of 0 causes the Engine instance to throw errors while an `errorLevel` of 1 would log errors to the console.

```javascript
const chaosEngine = chaos(); // chaosEngine.errorLevel => 0
chaosEngine.setErrorLevel(1); // chaosEngine.errorLevel => 1
chaosEngine.setErrorLevel({}); // Invalid errorLevel passed in, it would use the default value instead.
// chaosEngine.errorLevel => 0
```

### setDestructives

The `setDestructives` method allows custom destructive arguments to be passed in, these arguments are passed into `testFn` when running tests in place of the argument examples passed to `toTake`. The inbuilt destructives are available on the `defaultDestructives` property of the instance. Custom destructives can be accessed on the `destructives` property of the instance. Custom destructives must be an object with string keys and array values. If the object passed to setDestructives has keys that are not one of `string`, `number`, `boolean`, `object` or `generals`, custom types can be simulated. The `generals` array in the `destructives` object are used for all types and are always part of the args used to call `testFn`.

```javascript
const chaosEngine = chaos(); // chaosEngine.destructives => {}

chaosEngine.setDestructives(1); // Throws or logs an error depending on errorLevel

chaosEngine.setDestructives({
    string: ["      ", "23"]
}); // chaosEngine.destructives => {string: ["     ", "23"]}

chaosEngine.setDestructives({
    generals: ["      ", "23"], // These destructives will be used for all arguments, no matter the type
    boolean: [1, 0, "", Infinity]
}); // chaosEngine.destructives => {generals: ["     ", "23"], boolean: [1, 0, "", Infinity]}

chaosEngine.setDestructives({
    test: ["      ", "23"] // Passing this type of key allows you pass a type of "test" to toTake method
}); // chaosEngine.destructives => {test: ["     ", "23"]}
```

### toTake

The `toTake` method is used to pass the argument example and type to the ChaosEngine instance. It can be called with 1-2 arguments and only specifies one arg to be passed into `testFn`. You must have initialized the Engine instance with a `testFn` or called `setFn` successfully in order to call `toTake` method.

-   If `toTake` is called with one argument, the argument is assumed to be an example of arg and its type is automatically deduced.
-   If `toTake` is called with 2 arguments, the first is the arg example and the second becomes the arg type.

```javascript
const chaosEngine = chaos(sum);
chaosEngine.toTake(4); //type of arg is deduced to be "number"
chaosEngine.toTake("hello", "string"); //arg example is type checked to see if "hello" has type "string"
chaosEngine.toTake({
    a: 24,
    b: {
        c: {
            d: true
        }
    }
});
/*
 * type of arg is deduced to be {
 *      a: "number",
 *      b: {
 *          c: {
 *              d: "boolean"
 *          }
 *      }
 * }
 */
```

-   The `typeDeducer` function only deduces types for "string", "number", "boolean" and "object" as shown above.
-   If a particular type is not deducible, the `typeDeducer` returns "object" by default(which means only "object" and "generals" args would be passed when testing).
-   You can add custom types by ensuring the custom type string is available as a key on the `destructives` property of the instance(which means you must have called `setDestructives` with an object containing the custom type as one of its keys).

### toReturn

The `toReturn` method accepts the same arguments as `toTake` method and specifies the return example and type of the `testFn`. This method returns the Engine instance and adds a property to the results, `matchedReturnType`, which specifies for each test if the returned result from `testFn` matched the type passed to or deduced by `toReturn`.

### run

The `run` method starts the process of testing and would throw an error if `toTake` had not been called initially. It returns the results of the destructive tests. You can call the `run` method after calling `toReturn` or `toTake` in order to run the tests. The `run` method also works for asynchronous functions but if you want to be explicit, use `runAsync` below

### runAsync

The `runAsync` method starts the process of testing for asynchronous functions and would throw an error if `toTake` had not been called initially. It returns a promise that resolves to the results of the destructive tests. You can call the `runAsync` method after calling `toReturn` or `toTake` in order to run the tests.

### refresh

The `refresh` method clears and resets the ChaosEngine instance. After calling this, you have to set up the instance again. It is called by `setFn` internally, so args for one `testFn` are not carried over to the new `testFn`. Note that this also resets `errorLevel` to `0` and clears custom destructives, so call `setErrorLevel` and `setDestructives` after `setFn`.

## Examples

```javascript
// Test With A Function That Accepts No Argument
import { chaos } from "@la-bete/chaos-engine";
let result;
function log() {
    console.log("Hello, World");
}
const chaosEngine = chaos(log); // No custom destructives and errorLevel is set to THROW
chaosEngine.toTake(null); // Pass null to indicate that the function takes no arguments
result = chaosEngine.run(); // result will have status of "success" and only destructive arguments in the "generals" array will be used to test the "log" function

// Test With A Function That Accepts One Argument
function returnStringVal(val) {
    return String(val);
}
chaosEngine.setFn(returnStringVal);
chaosEngine.toTake(2).toReturn("2");
result = chaosEngine.run(); // Destructive arguments passed to "returnStringVal" will include "number" and "generals" array members. Since toReturn is called as well, the "matchedReturnType" field will be present for each test

// Test With An Async Function That Accepts One Argument
async function asyncReturnStringVal(val) {
    return String(val);
}
chaosEngine.setFn(asyncReturnStringVal);
chaosEngine.toTake(2).toReturn("2");
chaosEngine.runAsync().then((result) => {
    // result would be same as specified for "returnStringVal" above
});
```

## CLI

### Notes

-   The CLI also works with modules that export `async` functions.

### Installation

```
$ npm install @la-bete/chaos-engine -g
```

### Usage

```
$ chaos
```

Calling `chaos` like above will cause the Chaos CLI tool to search for `chaos.config.js` in the current directory for configuration options. You can also call it like below to pass a custom config file:

```
$ chaos --config=destructiveTestsConfig.js
```

or

```
$ chaos --config=/absolute/path/to/config.js
```

The config file should export an object with fields as specified below. All fields should be in camelCase.

### files

-   This field is required in the config file and should be an object.
-   The `files` object should have keys specifying the location of the file to run tests on relative to the config file.
-   Each key should have an object value that specifies the inputs, output, errorLevel and destructives to run the test with.
-   The `inputs` field is required and correlates with examples of arguments the `testFn` should take and should be an array. The `inputs` field could also be an array of arrays, each with length of `2` and the first element corresponding to the arg example, while the second element corresponds to the arg type, in the same order as passed to `toTake` or `toReturn`.
-   The `output` specifies an example of the expected return value. It could be a single value, or an array consisting of the return example and return type.
-   The `errorLevel` specifies the `errorLevel` when running tests on that particular file, while `destructives` are custom destructives that will be used during the tests for this file if supplied.

### errorLevel

-   This field represents the fallback error level if none is passed for a particular file we're running tests on. It defaults to `0` which signifies any errors encountered will be thrown.

### destructives

-   This field also represents fallback custom destructives to be used if none is passed for a specific file. It defaults to `{}`.

A typical config example can be found below:

```javascript
module.exports = {
    files: {
        "noGoodModule.js": {
            inputs: [null]
        },
        "sum.js": {
            inputs: [2, 3],
            output: 5,
            errorLevel: 0
        },
        "src/concat.js": {
            inputs: [["hello", "string"], "world"],
            output: "helloworld",
            destructives: {
                string: [NaN, Infinity, {}]
            }
        },
        "dist/addStringToNumber.js": {
            inputs: [
                ["13", "string"],
                [2, "number"]
            ],
            output: "15",
            destructives: {
                string: ["", "    Infinite   ", {}],
                number: [{}, Infinity, NaN]
            },
            errorLevel: 1
        }
    },
    errorLevel: 1,
    destructives: {
        number: [NaN, "    "],
        string: [{}, []]
    }
};
```
