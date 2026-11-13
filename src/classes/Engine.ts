import generateArgs from "../helpers/generateArgs";
import { throwError, returnError, errorMessage } from "./Error";
import {
    destructiveArgs,
    isThenable,
    isValidObject,
    UserDestructives
} from "../helpers/utilities";

export interface Result {
    matchedReturnType?: boolean;
    error: boolean;
    output: unknown;
    timeTaken: string;
    inputs: unknown[];
}

export interface TestResults {
    status: "success" | "error";
    message?: string;
    data?: Result[];
}

export default class Engine {
    private fnReturnValue: unknown;
    private fnReturnType: unknown;
    private readonly fnArgs: unknown[] = [];
    private readonly destructiveArgs: Array<Array<unknown>> = [];

    constructor(
        private _fn?: Function,
        private _errorLevel: 0 | 1 = 0,
        private _userDestructives: UserDestructives = {}
    ) {
        typeof _fn !== "undefined" && this.setFn(_fn);
        this.setErrorLevel(_errorLevel);
        this.setDestructives(_userDestructives);
    }

    get defaultDestructives() {
        const result: { [x: string]: any[] } = {};
        for (const each in destructiveArgs) {
            //@ts-ignore
            const args = destructiveArgs[each];
            if (Array.isArray(args)) result[each] = [...args];
        }
        return { ...result };
    }

    get destructives() {
        const result: { [x: string]: any[] } = {};
        for (const each in this._userDestructives) {
            if (Array.isArray(this._userDestructives[each]))
                result[each] = [...this._userDestructives[each]];
        }
        return { ...result };
    }

    get fn() {
        return this._fn;
    }

    get errorLevel() {
        return this._errorLevel;
    }

    setDestructives(destructives: UserDestructives) {
        const result: { [x: string]: any[] } = {};
        if (!this.validateObject(destructives)) {
            this.sendError(
                `Expected an object argument for setDestructives method, got '${JSON.stringify(
                    destructives
                )}'`
            );
            destructives = {};
        }
        for (const each in destructives) {
            const arr = destructives[each];
            if (Array.isArray(arr)) result[each] = [...arr];
            else
                this.sendError(
                    `Expected an array for each destructive property, got '${JSON.stringify(
                        arr
                    )}'`
                );
        }
        this._userDestructives = { ...result };
        return this;
    }

    setFn(fn: Function) {
        if (!fn || typeof fn !== "function")
            this.sendError("Chaos Engine expects a function argument");
        else {
            this.refresh();
            this._fn = fn;
        }
        return this;
    }

    setErrorLevel(errorLevel: 0 | 1) {
        if (errorLevel !== this.errorLevel) {
            if (errorLevel === 1) this._errorLevel = 1;
            else {
                if (errorLevel !== 0)
                    returnError(
                        `Invalid error level '${errorLevel}' passed in, using default error level...`
                    );
                this._errorLevel = 0;
            }
        }
        return this;
    }

    toTake(argExample: unknown, argType?: unknown) {
        if (typeof this.fn !== "function") {
            this.sendError(
                "You have to set the function before passing its arguments."
            );
            return this;
        }
        if (
            typeof argType === "undefined" &&
            typeof argExample === "undefined"
        ) {
            this.sendError("ToTake method requires between 1-2 arguments");
        } else {
            if (typeof argType === "undefined") {
                argType = this.buildType(argExample);
            }
            if (this.typeCheck(argType, argExample)) {
                this.destructiveArgs.push(
                    this.generateArgs(argType, argExample)
                );
                this.fnArgs.push(argExample);
            } else {
                this.sendError(
                    `ToTake expects the example ${JSON.stringify(
                        argExample
                    )} to have type ${JSON.stringify(argType)}`
                );
            }
        }
        return this;
    }

    toReturn(returnExample: unknown, returnType?: unknown) {
        if (typeof this.fn !== "function") {
            this.sendError(
                "You have to set the function before passing a return value."
            );
            return this;
        }
        if (
            typeof returnType === "undefined" &&
            typeof returnExample === "undefined"
        ) {
            this.sendError("ToReturn method requires between 1-2 arguments");
        } else {
            if (typeof returnType === "undefined") {
                returnType = this.buildType(returnExample);
            }
            if (this.typeCheck(returnType, returnExample)) {
                this.fnReturnValue = returnExample;
                this.fnReturnType = returnType;
            } else {
                this.sendError(
                    `ToReturn expects the example ${JSON.stringify(
                        returnExample
                    )} to have type ${JSON.stringify(returnType)}`
                );
            }
        }
        return this;
    }

    /**
     * Runs every destructive call. Returns the results directly when every
     * call returned synchronously, or a promise of them as soon as any call
     * returned a promise (async functions always do).
     */
    run(): TestResults | Promise<TestResults> {
        if (this.fnArgs.length === 0) {
            return this.sendError(
                "You have to call ToTake method at least once before calling the Run method."
            );
        }
        const results = this.startTesting();
        if (results.some(isThenable)) {
            return Promise.all(results).then((data) => ({
                status: "success" as const,
                data
            }));
        }
        return {
            status: "success",
            data: results as Result[]
        };
    }

    /** Same as `run`, but always returns a promise. */
    async runAsync(): Promise<TestResults> {
        if (this.fnArgs.length === 0) {
            return this.sendError(
                "You have to call ToTake method at least once before calling the RunAsync method."
            );
        }
        return {
            status: "success",
            data: await Promise.all(this.startTesting())
        };
    }

    refresh() {
        this.fnReturnValue = undefined;
        this.fnReturnType = undefined;
        this.fnArgs.length = 0;
        this.destructiveArgs.length = 0;
        this._fn = undefined;
        this._userDestructives = {};
        this._errorLevel = 0;
        return this;
    }

    private generateArgs(argType: unknown, argExample?: unknown) {
        return generateArgs(argType, argExample, this._userDestructives);
    }

    private startTesting() {
        const results: (Result | Promise<Result>)[] = [];
        for (let i = 0; i < this.destructiveArgs.length; i++) {
            for (const destructiveArg of this.destructiveArgs[i]) {
                const args = [...this.fnArgs];
                args[i] = destructiveArg;
                results.push(this.runTest(args));
            }
        }
        return results;
    }

    private typeCheck(type: any, example: any): boolean {
        if (typeof type === "undefined") return false;
        if (typeof type === "string") {
            if (type.includes("|")) {
                return type
                    .split("|")
                    .some((forType) => this.typeCheck(forType, example));
            } else {
                type = type.trim();
                const isAnUnknownType = !this.defaultDestructives[type];
                return (
                    (isAnUnknownType &&
                        Array.isArray(this.destructives[type])) ||
                    typeof example === type
                );
            }
        } else if (this.validateObject(type)) {
            if (!this.validateObject(example)) return false;
            for (const prop in type) {
                if (!this.typeCheck(type[prop], example[prop])) return false;
            }
            return true;
        }
        return false;
    }

    private buildType(example: unknown) {
        let type: string | object = "object";
        if (typeof example === "undefined")
            return this.sendError("BuildType method requires an argument");
        if (typeof example !== "object") type = typeof example;
        else if (this.validateObject(example)) {
            type = {};
            for (const prop in example) {
                //@ts-ignore
                const propType = this.buildType(example[prop]);
                //@ts-ignore
                type[prop] = propType;
            }
        }
        return type;
    }

    private get expectsReturn() {
        return typeof this.fnReturnType !== "undefined";
    }

    private runTest(args: unknown[]): Result | Promise<Result> {
        const start = Date.now();
        const finish = (error: boolean, output: unknown): Result => {
            const result: Result = {
                error,
                inputs: args,
                output,
                timeTaken: Date.now() - start + "ms"
            };
            if (this.expectsReturn) {
                result.matchedReturnType =
                    !error && this.typeCheck(this.fnReturnType, output);
            }
            return result;
        };
        let response: unknown;
        try {
            response = (this.fn as Function)(...args);
        } catch (e) {
            return finish(true, errorMessage(e));
        }
        if (isThenable(response)) {
            return Promise.resolve(response).then(
                (value) => finish(false, value),
                (e: unknown) => finish(true, errorMessage(e))
            );
        }
        return finish(false, response);
    }

    protected sendError(message: string) {
        const error =
            this.errorLevel === 1 ? returnError(message) : throwError(message);
        return error.toJSON();
    }

    private validateObject(obj: unknown) {
        return isValidObject(obj);
    }
}
