import type { ExcalidrawTextElement, FontFamilyValues } from "../../element/src/types";
/**
 * Encapsulates font metrics with additional font metadata.
 * */
export interface FontMetadata {
    /** for head & hhea metrics read the woff2 with https://fontdrop.info/ */
    metrics: {
        /** head.unitsPerEm metric */
        unitsPerEm: 1000 | 1024 | 2048;
        /** hhea.ascender metric */
        ascender: number;
        /** hhea.descender metric */
        descender: number;
        /** harcoded unitless line-height, https://github.com/excalidraw/excalidraw/pull/6360#issuecomment-1477635971 */
        lineHeight: number;
    };
    /** flag to indicate a deprecated font */
    deprecated?: true;
    /**
     * whether this is a font that users can use (= shown in font picker)
     */
    private?: true;
    /** flag to indiccate a local-only font */
    local?: true;
    /** flag to indicate a fallback font */
    fallback?: true;
}
export declare const FONT_METADATA: Record<number, FontMetadata>;
/** Unicode ranges defined by google fonts */
export declare const GOOGLE_FONTS_RANGES: {
    LATIN: string;
    LATIN_EXT: string;
    CYRILIC_EXT: string;
    CYRILIC: string;
    VIETNAMESE: string;
};
/** local protocol to skip the local font from registering or inlining */
export declare const LOCAL_FONT_PROTOCOL = "local:";
/**
 * Calculates vertical offset for a text with alphabetic baseline.
 */
export declare const getVerticalOffset: (fontFamily: ExcalidrawTextElement["fontFamily"], fontSize: ExcalidrawTextElement["fontSize"], lineHeightPx: number) => number;
/**
 * Gets line height for a selected family.
 */
export declare const getLineHeight: (fontFamily: FontFamilyValues) => ExcalidrawTextElement["lineHeight"];
