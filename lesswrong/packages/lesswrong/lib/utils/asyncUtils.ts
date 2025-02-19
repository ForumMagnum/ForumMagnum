import { inspect } from "util";

/// Like _.filter, but with an async filter function. Given an array and an async function, return
/// an array containing the subset of the original array for which the filter returns true, in the
/// same order. Filters will be run on array elements in parallel (to the extent async is parallel).
/// This function assumes that the array is not modified in the background, and that the filter
/// doesn't care about execution order.
export const asyncFilter = async <T>(list: Array<T>, filter: (x: T) => Promise<boolean>): Promise<Array<T>> => {
  const filterPromises: Array<Promise<boolean>> = list.map(filter);
  const filterMatches: Array<boolean> = await Promise.all(filterPromises);
  
  let result: Array<T> = [];
  for (let i=0; i<filterMatches.length; i++) {
    if (filterMatches[i])
      result.push(list[i]);
  }
  return result;
}

/// Like Array.forEach, but with an async function. Runs the function on elements
/// sequentially (no parallelism).
export const asyncForeachSequential = async <T>(list: Array<T>, fn: (x: T,i: number) => Promise<void>): Promise<void> => {
  let i=0;
  for (let x of list)
    await fn(x, i++);
}

/// Like Array.map, but with an async function. Runs the function on elements
/// sequentially (no parallelism).
export const asyncMapSequential = async <T, O>(list: Array<T>, fn: (x: T,i: number) => Promise<O>): Promise<O[]> => {
  let i=0;
  const results: O[] = [];
  for (let x of list) {
    const result = await fn(x, i++);
    results.push(result);
  }

  return results;
}

/// Like Array.forEach, but with an async function. Runs the function on elements in parallel.
export const asyncForeachParallel = async <T>(list: Array<T>, fn: (x: T, i: number) => Promise<void>): Promise<void> => {
  await Promise.all(list.map((x,i) => fn(x,i)));
}

export const promisify = (fn: Function) =>
  (...args: any[]) =>
    new Promise((resolve, reject) => {
      fn(...args, (err: any, data: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })

export async function sleep(duration: number): Promise<void> {
  return new Promise((resolve) => { setTimeout(resolve, duration); });
}

/**
 * Execute the functions in promiseGenerators, up to maxConcurrent at a time. Return an array of
 * the results of all the promises, in the order they were generated.
 */
export async function executePromiseQueue<T>(
  promiseGenerators: (() => Promise<T>)[],
  maxConcurrent: number
): Promise<T[]> {
  let queue: Promise<T>[] = [];
  const results: Promise<T>[] = [];

  // Execute up to maxConcurrent queries at a time
  for (const promiseGenerator of promiseGenerators) {
    // Add the new promise to the queue
    const promise = promiseGenerator();
    queue.push(promise);
    results.push(promise);

    // If the queue is full, wait for one promise to finish
    if (queue.length >= maxConcurrent) {
      await Promise.race(queue);
      // Remove resolved promises from the queue
      queue = queue.filter((p) => inspect(p).includes("pending"));
    }
  }

  // Wait for all remaining promises to finish
  await Promise.all(queue);
  return Promise.all(results);
}

/**
 * Given a function that takes an array of values and returns a promise, execute the function on
 * chunks of the values, up to chunkSize at a time. Return a flattened array of all the results
 * in the order they were given. If func returns 1 result per value, then the result array will
 * be as if func was called on all the values at once.
 */
export async function executeChunkedQueue<T, V>(
  func: (chunk: V[]) => Promise<T[]>,
  values: V[],
  chunkSize = 200,
  maxConcurrent = 4
): Promise<T[]> {
  const chunks = [];
  for (let i = 0; i < values.length; i += chunkSize) {
    chunks.push(values.slice(i, i + chunkSize));
  }
  const promiseGenerators = chunks.map((chunk) => () => func(chunk));
  return (await executePromiseQueue(promiseGenerators, maxConcurrent)).flat();
}

type PromiseObject = { [key: string]: Promise<any> };
type UnwrapPromises<T extends PromiseObject> = {
  [K in keyof T]: T[K] extends Promise<infer U> ? U : T[K];
};

export async function namedPromiseAll<T extends PromiseObject>(
  obj: T
): Promise<UnwrapPromises<T>> {
  const keys = Object.keys(obj);
  const promises = Object.values(obj);
  
  const results = await Promise.all(promises);
  
  return Object.fromEntries(
    keys.map((key, index) => [key, results[index]])
  ) as UnwrapPromises<T>;
}
