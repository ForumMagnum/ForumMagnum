/**
 * DON'T depend on anything from the outside like `promiseTry`, as this module is part of a separate lazy-loaded chunk.
 *
 * Including anything from the main chunk would include the whole chunk by default.
 * Even it it would be tree-shaken during build, it won't be tree-shaken in dev.
 *
 * In the future consider separating common utils into a separate shared chunk.
 */
/**
 * Shared commands between the main thread and worker threads.
 */
export declare const Commands: {
    readonly Subset: "SUBSET";
};
/**
 * Used by browser (main thread), node and jsdom, to subset the font based on the passed codepoints.
 *
 * @returns woff2 font as a base64 encoded string
 */
export declare const subsetToBase64: (arrayBuffer: ArrayBuffer, codePoints: Array<number>) => Promise<string>;
/**
 * Used by browser (worker thread) and as part of `subsetToBase64`, to subset the font based on the passed codepoints.
 *
 * @eturns woff2 font as an ArrayBuffer, to avoid copying large strings between worker threads and the main thread.
 */
export declare const subsetToBinary: (arrayBuffer: ArrayBuffer, codePoints: Array<number>) => Promise<ArrayBuffer>;
/**
 * Util for isomoprhic browser (main thread), node and jsdom usage.
 *
 * Isn't used inside the worker to avoid copying large binary strings (as dataurl) between worker threads and the main thread.
 */
export declare const toBase64: (arrayBuffer: ArrayBuffer) => Promise<string>;
