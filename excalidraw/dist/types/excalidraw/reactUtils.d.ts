/**
 * @param func handler taking at most single parameter (event).
 */
export declare const withBatchedUpdates: <TFunction extends ((event: any) => void) | (() => void)>(func: Parameters<TFunction>["length"] extends 0 | 1 ? TFunction : never) => TFunction;
/**
 * barches React state updates and throttles the calls to a single call per
 * animation frame
 */
export declare const withBatchedUpdatesThrottled: <TFunction extends ((event: any) => void) | (() => void)>(func: Parameters<TFunction>["length"] extends 0 | 1 ? TFunction : never) => {
    (...args: Parameters<TFunction>): void;
    flush(): void;
    cancel(): void;
};
export declare const isRenderThrottlingEnabled: () => boolean;
