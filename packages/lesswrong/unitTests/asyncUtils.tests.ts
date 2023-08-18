// Tests for packages/lesswrong/lib/utils/asyncUtils.ts

import { performance } from "perf_hooks";
import { executeChunkedQueue, executePromiseQueue, sleep } from "../lib/utils/asyncUtils";

describe("executePromiseQueue", () => {
  test("executePromiseQueue returns the same value as awaiting Promise.all()", async () => {
    const promiseGenerators = [
      () => Promise.resolve(1),
      () => new Promise((resolve) => setTimeout(() => resolve(2), 200)),
      () => new Promise((resolve) => setTimeout(() => resolve(3), 100)),
    ];

    const promiseQueueResult = await executePromiseQueue(promiseGenerators, 2);
    const promiseAllResult = await Promise.all(
      promiseGenerators.map((gen) => gen())
    );

    expect(promiseQueueResult).toEqual(promiseAllResult);
  });

  test("executePromiseQueue executes maxConcurrent async functions in parallel", async () => {
    const promiseGenerators = Array.from({ length: 10 }, (_, i) => async () => {
      const startTime = performance.now();
      await sleep(100); // simulate a slow promise
      const endTime = performance.now();
      return { startTime, endTime, i };
    });

    const results = await executePromiseQueue(promiseGenerators, 4);

    // Check the start and end times to ensure that there were 4 concurrent promises
    results.sort((a, b) => a.startTime - b.startTime);
    for (let i = 0; i < results.length; i += 4) {
      expect(
        Math.max(...results.slice(i, i + 4).map((res) => res.endTime)) -
          results[i].startTime
      ).toBeLessThanOrEqual(140); // allow some tolerance
    }
  });
});

describe("executeChunkedQueue", () => {
  test("executeChunkedQueue basic functionality and default values", async () => {
    // Define a function that takes a number and returns it incremented
    const func = async (chunk: number[]) => chunk.map((n) => n + 1);

    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const results = await executeChunkedQueue(func, values);

    // Check if results are as expected
    expect(results).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  test("executeChunkedQueue preserves order and applies default values", async () => {
    // Define a function that sleeps for a random time before returning the input number
    const func = async (chunk: number[]) =>
      Promise.all(
        chunk.map(
          (n) =>
            new Promise((resolve) =>
              setTimeout(() => resolve(n), Math.random() * 200)
            )
        )
      );

    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const results = await executeChunkedQueue(func, values);

    // Check if results are in the same order as input values
    expect(results).toEqual(values);
  });
});
