/**
 * Tries to subset glyphs in a font based on the used codepoints, returning the font as dataurl.
 * Under the hood utilizes worker threads (Web Workers, if available), otherwise fallbacks to the main thread.
 *
 * Check the following diagram for details: link.excalidraw.com/readonly/MbbnWPSWXgadXdtmzgeO
 *
 * @param arrayBuffer font data buffer in the woff2 format
 * @param codePoints codepoints used to subset the glyphs
 *
 * @returns font with subsetted glyphs (all glyphs in case of errors) converted into a dataurl
 */
export declare const subsetWoff2GlyphsByCodepoints: (arrayBuffer: ArrayBuffer, codePoints: Array<number>) => Promise<string>;
