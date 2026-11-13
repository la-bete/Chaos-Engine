export interface Destructives {
    string: unknown[];

    number: unknown[];

    boolean: unknown[];

    object: unknown[];

    generals: unknown[];
}

/** Custom destructive values, keyed by type name. */
export type UserDestructives = { [type: string]: unknown[] };

export const destructiveArgs: Destructives = {
    string: ["", "   ", "13467", []],

    number: [-1, Infinity, -Infinity, NaN, 10007199254740992],

    boolean: [1, 0, "", []],

    object: [
        {},
        [],
        {
            destroy: "24"
        },
        2000000000000000000
    ],

    generals: [null, undefined]
};

export function isValidObject(obj: unknown): obj is Record<string, unknown> {
    return (
        typeof obj === "object" &&
        obj !== null &&
        obj.constructor?.name === "Object"
    );
}

export function isThenable(value: unknown): value is PromiseLike<unknown> {
    return (
        (typeof value === "object" || typeof value === "function") &&
        value !== null &&
        typeof (value as { then?: unknown }).then === "function"
    );
}
