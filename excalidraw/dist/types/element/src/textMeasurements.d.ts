import type { FontString, ExcalidrawTextElement } from "./types";
export declare const measureText: (text: string, font: FontString, lineHeight: ExcalidrawTextElement["lineHeight"]) => {
    width: number;
    height: number;
};
export declare const getApproxMinLineWidth: (font: FontString, lineHeight: ExcalidrawTextElement["lineHeight"]) => number;
export declare const getMinTextElementWidth: (font: FontString, lineHeight: ExcalidrawTextElement["lineHeight"]) => number;
export declare const isMeasureTextSupported: () => boolean;
export declare const normalizeText: (text: string) => string;
/**
 * To get unitless line-height (if unknown) we can calculate it by dividing
 * height-per-line by fontSize.
 */
export declare const detectLineHeight: (textElement: ExcalidrawTextElement) => ExcalidrawTextElement["lineHeight"];
/**
 * We calculate the line height from the font size and the unitless line height,
 * aligning with the W3C spec.
 */
export declare const getLineHeightInPx: (fontSize: ExcalidrawTextElement["fontSize"], lineHeight: ExcalidrawTextElement["lineHeight"]) => number;
export declare const getApproxMinLineHeight: (fontSize: ExcalidrawTextElement["fontSize"], lineHeight: ExcalidrawTextElement["lineHeight"]) => number;
/**
 * Set a custom text metrics provider.
 *
 * Useful for overriding the width calculation algorithm where canvas API is not available / desired.
 */
export declare const setCustomTextMetricsProvider: (provider: TextMetricsProvider) => void;
export interface TextMetricsProvider {
    getLineWidth(text: string, fontString: FontString): number;
}
export declare const getLineWidth: (text: string, font: FontString) => number;
export declare const getTextWidth: (text: string, font: FontString) => number;
export declare const getTextHeight: (text: string, fontSize: number, lineHeight: ExcalidrawTextElement["lineHeight"]) => number;
export declare const charWidth: {
    calculate: (char: string, font: FontString) => number;
    getCache: (font: FontString) => number[];
    clearCache: (font: FontString) => void;
};
export declare const getMinCharWidth: (font: FontString) => number;
export declare const getMaxCharWidth: (font: FontString) => number;
