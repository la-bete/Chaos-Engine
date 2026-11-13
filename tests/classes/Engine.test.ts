import ChaosEngine from "../../src/classes/Engine";
import { destructiveArgs } from "../../src/helpers/utilities";

function sum(a: number, b: number) {
    return a + b;
}
async function sumAsync(a: number, b: number) {
    return a + b;
}
let customDestructives: { [x: string]: unknown[] };

describe("Chaos Engine", () => {
    beforeEach(() => {
        customDestructives = {
            string: ["hello", 89, {}],
            object: [
                67,
                [],
                {
                    a: [0, 9],
                    b: "hello"
                }
            ]
        };
    });

    it("should have a setFn method that changes the function to test and throws if an invalid function is passed in", () => {
        const chaosEngine = new ChaosEngine(sum);
        expect(chaosEngine.fn).toEqual(sum);
        const newFn = () => {};
        chaosEngine.setFn(newFn);
        expect(chaosEngine.fn).toEqual(newFn);
        //@ts-ignore
        expect(() => chaosEngine.setFn(23)).toThrowError(
            "Chaos Engine expects a function argument"
        );
    });

    it("should have a setErrorLevel method that changes the errorLevel, determining if it should throw errors or log them", () => {
        const chaosEngine = new ChaosEngine(sum);
        expect(chaosEngine.errorLevel).toEqual(0);
        chaosEngine.setErrorLevel(1);
        expect(chaosEngine.errorLevel).toEqual(1);
    });

    it("should have a setDestructives method that can be used to change the user-provided detructives for testing", () => {
        const chaosEngine = new ChaosEngine(sum, 1, customDestructives);
        expect(chaosEngine.destructives).toStrictEqual(customDestructives);
        chaosEngine.setDestructives({});
        expect(chaosEngine.destructives).toStrictEqual({});
        chaosEngine.setDestructives({ test: [1, 2, 3] });
        expect(chaosEngine.destructives).toStrictEqual({ test: [1, 2, 3] });
        chaosEngine.setDestructives(undefined);
        expect(chaosEngine.destructives).toStrictEqual({});
        expect(() =>
            //@ts-ignore
            chaosEngine.setErrorLevel(0).setDestructives(45)
        ).toThrowError();
    });

    it("should not include the user-provided destructives if they are not valid arrays", () => {
        const chaosEngine = new ChaosEngine(sum, 1, customDestructives);
        expect(chaosEngine.destructives).toStrictEqual(customDestructives);
        //@ts-ignore
        chaosEngine.setDestructives({ test: 23 });
        expect(chaosEngine.destructives.test).toBeUndefined;
        //@ts-ignore
        chaosEngine.setDestructives({ test: "  test  " });
        expect(chaosEngine.destructives.test).toBeUndefined;
    });

    it("should use the default error level if an invalid number is passed in", () => {
        const chaosEngine = new ChaosEngine(sum, 1);
        expect(chaosEngine.errorLevel).toEqual(1);
        //@ts-ignore
        chaosEngine.setErrorLevel("");
        expect(chaosEngine.errorLevel).toEqual(0);
        //@ts-ignore
        expect(chaosEngine.setErrorLevel(25).errorLevel).toEqual(0);
    });

    it("should have a refresh method that resets the Engine instance", () => {
        const chaosEngine = new ChaosEngine(sum, 1, customDestructives);
        expect(chaosEngine.fn).toEqual(sum);
        expect(chaosEngine.errorLevel).toEqual(1);
        expect(chaosEngine.destructives).toStrictEqual(customDestructives);
        chaosEngine.refresh();
        expect(chaosEngine.fn).toBeUndefined;
        expect(chaosEngine.errorLevel).toEqual(0);
        expect(chaosEngine.destructives).toStrictEqual({});
    });

    it("should have a toTake method that returns the chaosEngine allowing for chaining", () => {
        const chaosEngine = new ChaosEngine(sum);
        expect(chaosEngine.toTake(3, "number")).toStrictEqual(chaosEngine);
        expect(
            chaosEngine.toTake(5, "number").toTake(7, "number")
        ).toStrictEqual(chaosEngine);
    });

    it("should have a toTake method that throws if the function to be tested has not been set", () => {
        const chaosEngine = new ChaosEngine();
        expect(() => chaosEngine.toTake(3, "number")).toThrowError(
            "You have to set the function before passing its arguments."
        );
        chaosEngine.setFn(sum);
        expect(() => chaosEngine.toTake(3, "number")).not.toThrow();
    });

    it("should have a toTake method that throws if the type passed in does not match the example", () => {
        const chaosEngine = new ChaosEngine(sum);
        expect(() => chaosEngine.toTake("hello", "number")).toThrow();
        expect(() => chaosEngine.toTake(24, "undefined")).toThrow();
        expect(() => chaosEngine.toTake(undefined, "undefined")).not.toThrow();
        expect(() => chaosEngine.toTake(null, "undefined")).toThrow();
        expect(() => chaosEngine.toTake(true, "test")).toThrow();
    });

    it("should have a toTake method that returns the engine instance if errorLevel is 1 and an error is thrown", () => {
        const chaosEngine = new ChaosEngine(undefined, 1);
        expect(chaosEngine.toTake(2, "string")).toStrictEqual(chaosEngine);
        chaosEngine.setFn(sum).setErrorLevel(1); // Setting error level again because setFn refreshes instance
        expect(() => chaosEngine.toTake(2, "string")).not.toThrow();
    });

    it("should have a toReturn method that returns the Engine instance, allowing for chaining", () => {
        const chaosEngine = new ChaosEngine(sum);
        const result = chaosEngine
            .toTake(4, "number")
            .toTake(4, "number")
            .toReturn(8, "number");
        expect(result).toStrictEqual(chaosEngine);
    });

    it("should deduce the argument type if a single argument is passed to toReturn or toTake methods", () => {
        const chaosEngine = new ChaosEngine(sum);
        const result = chaosEngine.toTake(4).toTake(4).toReturn(8).run();
        expect(result).toHaveProperty("status", "success");
        expect(result).toHaveProperty("data");
        //@ts-ignore
        expect(result.data).toHaveLength(
            // Multiplying by 2 below because the sum function used for testing takes two numbers
            (destructiveArgs.number.length + destructiveArgs.generals.length) *
                2
        );
        const log = () => console.log("here");
        const result2 = chaosEngine.setFn(log).toTake(null).run();
        expect(result2).toHaveProperty("status", "success");
        expect(result2).toHaveProperty("data");
        //@ts-ignore
        expect(result2.data).toHaveLength(destructiveArgs.generals.length);
    });

    it("should also deduce types for object schemas", () => {
        const chaosEngine = new ChaosEngine(sum);
        const result = chaosEngine
            .toTake({
                a: 5,
                b: {
                    c: "hello"
                }
            })
            .toTake(4)
            .run();
        expect(result).toHaveProperty("status", "success");
        expect(result).toHaveProperty("data");
        //@ts-ignore
        expect(result.data).toHaveLength(
            // Multiplying by 2 below because the sum function used for testing takes two numbers
            destructiveArgs.object.length * 2 +
                destructiveArgs.string.length +
                destructiveArgs.number.length * 2 +
                destructiveArgs.generals.length * 5
        );
    });

    it("should also work with union types", () => {
        const chaosEngine = new ChaosEngine(sum);
        const result = chaosEngine
            .toTake(4, "string | number")
            .toTake(4, "string | number")
            .toReturn(8, "string | number")
            .run();
        expect(result).toHaveProperty("status", "success");
        expect(result).toHaveProperty("data");
        //@ts-ignore
        expect(result.data).toHaveLength(
            (destructiveArgs.number.length +
                destructiveArgs.generals.length +
                destructiveArgs.string.length) *
                2
        );
    });

    it("should throw an error if the type argument to toTake or toReturn does not match the example", () => {
        const chaosEngine = new ChaosEngine(sum);
        expect(() => chaosEngine.toTake("hello", "number")).toThrow();
        expect(() =>
            chaosEngine.toTake("true", "string").toReturn(true, "string")
        ).toThrow();
    });

    it("should throw an error if the run method is called without calling toTake initially or passing a function to test", () => {
        const chaosEngine = new ChaosEngine(sum);
        expect(() => chaosEngine.run()).toThrowError(
            "You have to call ToTake method at least once before calling the Run method."
        );
    });

    it("should include the user-provided destructives in its tests", () => {
        customDestructives.number = [3, 0, 9];
        const chaosEngine = new ChaosEngine(sum, 0, customDestructives);
        const result = chaosEngine
            .toTake(4, "number")
            .toTake(4, "number")
            .toReturn(8, "number")
            .run();
        expect(result).toHaveProperty("status", "success");
        expect(result).toHaveProperty("data");
        //@ts-ignore
        expect(result.data).toHaveLength(
            // Multiplying by 2 below because the sum function used for testing takes two numbers
            (destructiveArgs.number.length +
                destructiveArgs.generals.length +
                customDestructives.number.length) *
                2
        );
    });

    it("should include the user-provided destructives even if they are not part of the inbuilt indestructives", () => {
        customDestructives.random = [3, 0, 9];
        const chaosEngine = new ChaosEngine(sum, 0, customDestructives);
        const result = chaosEngine
            .toTake(4, "number")
            .toTake(4, "random")
            .toReturn(8, "number")
            .run();
        expect(result).toHaveProperty("status", "success");
        expect(result).toHaveProperty("data");
        //@ts-ignore
        expect(result.data).toHaveLength(
            destructiveArgs.number.length +
                customDestructives.random.length +
                destructiveArgs.generals.length * 2
        );
    });

    it("should have a toReturn method that throws or logs errors if the function to be tested has not been set", () => {
        const chaosEngine = new ChaosEngine();
        expect(() => chaosEngine.toReturn(3, "number")).toThrow();
        chaosEngine.setFn(sum);
        expect(() => chaosEngine.toReturn(3, "number")).not.toThrow();
    });

    it("should not throw error if errorLevel is set to 1", () => {
        const chaosEngine = new ChaosEngine(sum, 1, customDestructives);
        //@ts-ignore
        expect(() => chaosEngine.setFn(23)).not.toThrowError(
            "Chaos Engine expects a function argument"
        );
    });
    it("should throw error if errorLevel is set to 0", () => {
        const chaosEngine = new ChaosEngine(sum, 0, customDestructives);
        //@ts-ignore
        expect(() => chaosEngine.setFn(23)).toThrowError(
            "Chaos Engine expects a function argument"
        );
    });

    it("should catch errors that occur in the function to test", async () => {
        const throwingFn = () => {
            throw new Error("Test error");
        };
        const chaosEngine = new ChaosEngine(throwingFn);
        // Error here is cannot find property data on Promise<TestResults>
        // So I'm setting result to type any
        let result: any = chaosEngine.toTake(null).run();
        expect(result).toHaveProperty("status", "success");
        expect(
            result.data.every((r) => r.error && r.output === "Test error")
        ).toEqual(true);
        const asyncThrowingFn = async () => {
            throw new Error("Test error");
        };
        result = await chaosEngine
            .setFn(asyncThrowingFn)
            .toTake(null)
            .runAsync();
        expect(result).toHaveProperty("status", "success");
        expect(
            result.data.every((r) => r.error && r.output === "Test error")
        ).toEqual(true);
    });

    it("should have a runAsync method for handling async functions", async () => {
        const chaosEngine = new ChaosEngine(sumAsync);
        const result = await chaosEngine
            .toTake(2)
            .toTake(2)
            .toReturn(4)
            .runAsync();
        expect(result).toHaveProperty("status", "success");
        expect(result).toHaveProperty("data");
        //@ts-ignore
        expect(result.data).toHaveLength(
            (destructiveArgs.number.length + destructiveArgs.generals.length) *
                2
        );
    });

    it("should have a run method that can also handle async functions", async () => {
        const chaosEngine = new ChaosEngine(sumAsync);
        const result = await chaosEngine.toTake(2).toTake(2).toReturn(4).run();
        expect(result).toHaveProperty("status", "success");
        expect(result).toHaveProperty("data");
        //@ts-ignore
        expect(result.data).toHaveLength(
            (destructiveArgs.number.length + destructiveArgs.generals.length) *
                2
        );
    });
});
