import generateArgs from "../../src/helpers/generateArgs";
import { destructiveArgs } from "../../src/helpers/utilities";

describe("Generate Args", () => {
    it("should return an array of the type of arg passed in if present in the inbuilt destructives", () => {
        const args = generateArgs("string", "3");
        expect(args).toHaveLength(
            destructiveArgs.string.length + destructiveArgs.generals.length
        );
    });

    it("should return an array of each type of arg passed in if a union type is passed", () => {
        const args = generateArgs("string | number", "3");
        expect(args).toHaveLength(
            destructiveArgs.string.length +
                destructiveArgs.generals.length +
                destructiveArgs.number.length
        );
    });

    it("should also search in userDestructives arg if it is passed in", () => {
        const args = generateArgs("test", "3", { test: [4, 5] });
        // 2 below is the length of the array passed as the test property above
        expect(args).toHaveLength(destructiveArgs.generals.length + 2);
    });

    it("should not search in userDestructives arg if it is invalid", () => {
        //@ts-ignore
        const args = generateArgs("test", "3", { test: 34 });
        expect(args).toHaveLength(destructiveArgs.generals.length);
    });

    it("should return the array of general destructive args if an unknown type is passed in", () => {
        const args = generateArgs("unknown", "3");
        expect(args).toHaveLength(destructiveArgs.generals.length);
    });

    it("should also work if an object is passed in", () => {
        const args = generateArgs(
            {
                a: "string",
                c: {
                    d: "string"
                }
            },
            {
                a: "12",
                c: {
                    d: "hello"
                }
            }
        );
        expect(args).toHaveLength(
            (destructiveArgs.string.length + destructiveArgs.object.length) *
                2 +
                destructiveArgs.generals.length * 4
        );
    });
});
