export type VersionedSnapshot<T> = Readonly<{
    version: number;
    value: T;
}>;
export declare class VersionedSnapshotStore<T> {
    private readonly isEqual;
    private version;
    private value;
    private readonly waiters;
    private readonly subscribers;
    constructor(initialValue: T, isEqual?: (prev: T, next: T) => boolean);
    getSnapshot(): VersionedSnapshot<T>;
    set(nextValue: T): boolean;
    update(updater: (prev: T) => T): boolean;
    subscribe(subscriber: (snapshot: VersionedSnapshot<T>) => void): () => void;
    pull(sinceVersion?: number): Promise<VersionedSnapshot<T>>;
}
