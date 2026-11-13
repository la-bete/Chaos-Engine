export class ChaosError extends Error {
    constructor(message: string, stack?: string) {
        super(message);
        this.name = "ChaosError";
        if (stack) this.stack = stack;
    }
    toJSON() {
        return {
            status: "error" as const,
            message: this.message
        };
    }
}

export function throwError(message: string, stack?: string): never {
    throw new ChaosError(message, stack);
}

export function returnError(message: string) {
    const error = new ChaosError(message);
    console.log(error.toJSON());
    return error;
}

/** Message of anything that was thrown, including non-Error values. */
export function errorMessage(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
}
