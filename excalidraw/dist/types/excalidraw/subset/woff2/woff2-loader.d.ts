/**
 * DON'T depend on anything from the outside like `promiseTry`, as this module is part of a separate lazy-loaded chunk.
 *
 * Including anything from the main chunk would include the whole chunk by default.
 * Even it it would be tree-shaken during build, it won't be tree-shaken in dev.
 *
 * In the future consider separating common utils into a separate shared chunk.
 */
declare const load: () => Promise<{
    compress: (buffer: ArrayBuffer) => Uint8Array<ArrayBuffer>;
    decompress: (buffer: ArrayBuffer) => Uint8Array<ArrayBuffer>;
}>;
declare const _default: () => ReturnType<typeof load>;
export default _default;
