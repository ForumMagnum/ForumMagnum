import type { MaybePromise } from "./utility-types";
type Job<T, TArgs extends unknown[]> = (...args: TArgs) => MaybePromise<T>;
export declare class Queue {
    private jobs;
    private running;
    private tick;
    push<TValue, TArgs extends unknown[]>(jobFactory: Job<TValue, TArgs>, ...args: TArgs): Promise<TValue>;
}
export {};
