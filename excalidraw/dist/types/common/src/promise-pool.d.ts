export declare class PromisePool<T> {
    private readonly pool;
    private readonly entries;
    constructor(source: IterableIterator<Promise<void | readonly [number, T]>>, concurrency: number);
    all(): PromiseLike<T[]>;
}
