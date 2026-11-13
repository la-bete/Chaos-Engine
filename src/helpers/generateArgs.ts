import { destructiveArgs, isValidObject, UserDestructives } from "./utilities";
import { returnError } from "../classes/Error";

/**
 * Builds the list of destructive values for one argument.
 *
 * Built-in values for a type are combined with any user-supplied values for
 * the same type; user-only keys act as custom types. `generals` are always
 * included. Union types ("a | b") and object shapes are expanded recursively,
 * and the user's destructives are applied at every level.
 */
export default function generateArgs(
    argType: unknown,
    argExample: unknown,
    userDestructives: UserDestructives = {}
): unknown[] {
    const destructives: UserDestructives = { ...userDestructives };
    for (const [prop, builtIn] of Object.entries(destructiveArgs)) {
        const custom = userDestructives[prop];
        if (Array.isArray(custom)) {
            destructives[prop] = [...builtIn, ...custom];
        } else {
            if (custom)
                returnError(
                    `The values of the ${prop} property in the Destructives object must be an array, using defaults...`
                );
            destructives[prop] = [...builtIn];
        }
    }
    let destructiveArgsArr: unknown[] = [...destructives.generals];
    if (typeof argType === "string") {
        // null is passed to mean "takes no arguments": only generals apply
        if (argExample !== null) {
            const argTypeTrimmed = argType.trim();
            if (argTypeTrimmed.includes("|")) {
                for (const type of argTypeTrimmed.split("|")) {
                    destructiveArgsArr = destructiveArgsArr.concat(
                        generateArgs(type, argExample, userDestructives)
                    );
                }
            } else if (Array.isArray(destructives[argTypeTrimmed])) {
                destructiveArgsArr = destructiveArgsArr.concat(
                    destructives[argTypeTrimmed]
                );
            }
        }
    } else if (isValidObject(argType) && isValidObject(argExample)) {
        destructiveArgsArr = destructiveArgsArr.concat(destructives.object);
        for (const prop in argType) {
            const args = generateArgs(
                argType[prop],
                argExample[prop],
                userDestructives
            );
            for (const arg of args) {
                destructiveArgsArr.push({
                    ...argExample,
                    [prop]: arg
                });
            }
        }
    } else {
        returnError(`Unknown type ${JSON.stringify(argType)} passed in.`);
    }
    // We don't want duplicate args for union types
    return Array.from(new Set(destructiveArgsArr));
}
