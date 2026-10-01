type DataURL = string;
export declare class ExcalidrawFontFace {
    readonly urls: URL[] | DataURL[];
    readonly fontFace: FontFace;
    constructor(family: string, uri: string, descriptors?: FontFaceDescriptors);
    /**
     * Generates CSS `@font-face` definition with the (subsetted) font source as a data url for the characters within the unicode range.
     *
     * Retrieves `undefined` otherwise.
     */
    toCSS(characters: string): Promise<string> | undefined;
    /**
     * Tries to fetch woff2 content, based on the registered urls (from first to last, treated as fallbacks).
     *
     * @returns base64 with subsetted glyphs based on the passed codepoint, last defined url otherwise
     */
    getContent(codePoints: Array<number>): Promise<string>;
    fetchFont(url: URL | DataURL): Promise<ArrayBuffer>;
    private getUnicodeRangeRegex;
    private static createUrls;
    private static getFormat;
    private static normalizeBaseUrl;
}
export {};
