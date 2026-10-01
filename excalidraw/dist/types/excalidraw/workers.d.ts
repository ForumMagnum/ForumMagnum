/**
 * Pool of idle short-lived workers.
 *
 * IMPORTANT: for simplicity it does not limit the number of newly created workers, leaving it up to the caller to manage the pool size.
 */
export declare class WorkerPool<T, R> {
    private idleWorkers;
    private readonly workerUrl;
    private readonly workerTTL;
    private constructor();
    /**
     * Create a new worker pool.
     *
     * @param workerUrl - The URL of the worker file.
     * @param options - The options for the worker pool.
     * @throws If the worker is bundled into the main chunk.
     * @returns A new worker pool instance.
     */
    static create<T, R>(workerUrl: URL | undefined, options?: {
        ttl?: number;
    }): WorkerPool<T, R>;
    /**
     * Take idle worker from the pool or create a new one and post a message to it.
     */
    postMessage(data: T, options: StructuredSerializeOptions): Promise<R>;
    /**
     * Terminate the idle workers in the pool.
     */
    clear(): Promise<void>;
    /**
     * Used to get a worker from the pool or create a new one if there is no idle available.
     */
    private createWorker;
    private onMessageHandler;
    private onErrorHandler;
}
