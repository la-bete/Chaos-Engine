import Engine from "./classes/Engine";
import { isValidObject, UserDestructives } from "./helpers/utilities";

export type { Result, TestResults } from "./classes/Engine";
export type { UserDestructives } from "./helpers/utilities";
export { ChaosError } from "./classes/Error";
export type { Engine };

export interface Options {
    fn: Function;
    errorLevel?: 0 | 1;
    destructives?: UserDestructives;
}

export function chaos(
    optionsOrFn?: Options | Options["fn"],
    errorLevelArg?: Options["errorLevel"],
    userDestructivesArg?: Options["destructives"]
) {
    let fn, errorLevel, userDestructives;
    if (isValidObject(optionsOrFn)) {
        fn = (optionsOrFn as Options).fn;
        errorLevel = (optionsOrFn as Options).errorLevel;
        userDestructives = (optionsOrFn as Options).destructives;
    } else {
        fn = optionsOrFn;
        errorLevel = errorLevelArg;
        userDestructives = userDestructivesArg;
    }
    return new Engine(fn as Function, errorLevel, userDestructives);
}
