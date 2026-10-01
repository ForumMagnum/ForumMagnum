/**
 * Returns a stable function of the same type.
 */
export declare const useStableCallback: <T extends (...args: any[]) => any>(userFn: T) => T;
