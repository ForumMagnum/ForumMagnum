export declare const applyDarkModeFilter: (color: string, enable?: boolean) => string;
export declare const removeDarkModeFilter: (color: string) => string;
export type ColorTuple = readonly [string, string, string, string, string];
export type ColorPaletteCustom = {
    [key: string]: ColorTuple | string;
};
export type ColorShadesIndexes = [number, number, number, number, number];
export declare const MAX_CUSTOM_COLORS_USED_IN_CANVAS = 5;
export declare const COLORS_PER_ROW = 5;
export declare const DEFAULT_CHART_COLOR_INDEX = 4;
export declare const DEFAULT_ELEMENT_STROKE_COLOR_INDEX = 4;
export declare const DEFAULT_ELEMENT_BACKGROUND_COLOR_INDEX = 1;
export declare const COLOR_PALETTE: {
    readonly transparent: "transparent";
    readonly black: "#1e1e1e";
    readonly white: "#ffffff";
    readonly gray: readonly ["#f8f9fa", "#e9ecef", "#ced4da", "#868e96", "#343a40"];
    readonly red: readonly ["#fff5f5", "#ffc9c9", "#ff8787", "#fa5252", "#e03131"];
    readonly pink: readonly ["#fff0f6", "#fcc2d7", "#f783ac", "#e64980", "#c2255c"];
    readonly grape: readonly ["#f8f0fc", "#eebefa", "#da77f2", "#be4bdb", "#9c36b5"];
    readonly violet: readonly ["#f3f0ff", "#d0bfff", "#9775fa", "#7950f2", "#6741d9"];
    readonly blue: readonly ["#e7f5ff", "#a5d8ff", "#4dabf7", "#228be6", "#1971c2"];
    readonly cyan: readonly ["#e3fafc", "#99e9f2", "#3bc9db", "#15aabf", "#0c8599"];
    readonly teal: readonly ["#e6fcf5", "#96f2d7", "#38d9a9", "#12b886", "#099268"];
    readonly green: readonly ["#ebfbee", "#b2f2bb", "#69db7c", "#40c057", "#2f9e44"];
    readonly yellow: readonly ["#fff9db", "#ffec99", "#ffd43b", "#fab005", "#f08c00"];
    readonly orange: readonly ["#fff4e6", "#ffd8a8", "#ffa94d", "#fd7e14", "#e8590c"];
    readonly bronze: readonly ["#f8f1ee", "#eaddd7", "#d2bab0", "#a18072", "#846358"];
};
export type ColorPalette = typeof COLOR_PALETTE;
export type ColorPickerColor = keyof typeof COLOR_PALETTE;
/** number of slots in the color-picker top-picks strip — the strip layout is
 * sized for exactly this many swatches, and pick customization (replace /
 * reorder) preserves it */
export declare const COLOR_TOP_PICKS_SLOTS = 5;
export declare const DEFAULT_ELEMENT_STROKE_PICKS: ColorTuple;
export declare const DEFAULT_ELEMENT_BACKGROUND_PICKS: ColorTuple;
export declare const BUCKET_FILL_BACKGROUND_PICKS: ColorTuple;
export declare const DEFAULT_STICKY_NOTE_BG = "#ffdf6b";
export declare const STICKY_NOTE_STROKE_PICKS: ColorTuple;
export declare const STICKY_NOTE_BACKGROUND_PICKS: ColorTuple;
export declare const DEFAULT_CANVAS_BACKGROUND_PICKS: ColorTuple;
export declare const DEFAULT_ELEMENT_STROKE_COLOR_PALETTE: {
    readonly cyan: readonly ["#e3fafc", "#99e9f2", "#3bc9db", "#15aabf", "#0c8599"];
    readonly blue: readonly ["#e7f5ff", "#a5d8ff", "#4dabf7", "#228be6", "#1971c2"];
    readonly violet: readonly ["#f3f0ff", "#d0bfff", "#9775fa", "#7950f2", "#6741d9"];
    readonly grape: readonly ["#f8f0fc", "#eebefa", "#da77f2", "#be4bdb", "#9c36b5"];
    readonly pink: readonly ["#fff0f6", "#fcc2d7", "#f783ac", "#e64980", "#c2255c"];
    readonly green: readonly ["#ebfbee", "#b2f2bb", "#69db7c", "#40c057", "#2f9e44"];
    readonly teal: readonly ["#e6fcf5", "#96f2d7", "#38d9a9", "#12b886", "#099268"];
    readonly yellow: readonly ["#fff9db", "#ffec99", "#ffd43b", "#fab005", "#f08c00"];
    readonly orange: readonly ["#fff4e6", "#ffd8a8", "#ffa94d", "#fd7e14", "#e8590c"];
    readonly red: readonly ["#fff5f5", "#ffc9c9", "#ff8787", "#fa5252", "#e03131"];
    readonly transparent: "transparent";
    readonly white: "#ffffff";
    readonly gray: readonly ["#f8f9fa", "#e9ecef", "#ced4da", "#868e96", "#343a40"];
    readonly black: "#1e1e1e";
    readonly bronze: readonly ["#f8f1ee", "#eaddd7", "#d2bab0", "#a18072", "#846358"];
};
export declare const DEFAULT_ELEMENT_BACKGROUND_COLOR_PALETTE: {
    readonly cyan: readonly ["#e3fafc", "#99e9f2", "#3bc9db", "#15aabf", "#0c8599"];
    readonly blue: readonly ["#e7f5ff", "#a5d8ff", "#4dabf7", "#228be6", "#1971c2"];
    readonly violet: readonly ["#f3f0ff", "#d0bfff", "#9775fa", "#7950f2", "#6741d9"];
    readonly grape: readonly ["#f8f0fc", "#eebefa", "#da77f2", "#be4bdb", "#9c36b5"];
    readonly pink: readonly ["#fff0f6", "#fcc2d7", "#f783ac", "#e64980", "#c2255c"];
    readonly green: readonly ["#ebfbee", "#b2f2bb", "#69db7c", "#40c057", "#2f9e44"];
    readonly teal: readonly ["#e6fcf5", "#96f2d7", "#38d9a9", "#12b886", "#099268"];
    readonly yellow: readonly ["#fff9db", "#ffec99", "#ffd43b", "#fab005", "#f08c00"];
    readonly orange: readonly ["#fff4e6", "#ffd8a8", "#ffa94d", "#fd7e14", "#e8590c"];
    readonly red: readonly ["#fff5f5", "#ffc9c9", "#ff8787", "#fa5252", "#e03131"];
    readonly transparent: "transparent";
    readonly white: "#ffffff";
    readonly gray: readonly ["#f8f9fa", "#e9ecef", "#ced4da", "#868e96", "#343a40"];
    readonly black: "#1e1e1e";
    readonly bronze: readonly ["#f8f1ee", "#eaddd7", "#d2bab0", "#a18072", "#846358"];
};
export declare const getAllColorsSpecificShade: (index: 0 | 1 | 2 | 3 | 4) => ("#fff5f5" | "#ffc9c9" | "#ff8787" | "#fa5252" | "#e03131" | "#fff0f6" | "#fcc2d7" | "#f783ac" | "#e64980" | "#c2255c" | "#f8f0fc" | "#eebefa" | "#da77f2" | "#be4bdb" | "#9c36b5" | "#f3f0ff" | "#d0bfff" | "#9775fa" | "#7950f2" | "#6741d9" | "#e7f5ff" | "#a5d8ff" | "#4dabf7" | "#228be6" | "#1971c2" | "#e3fafc" | "#99e9f2" | "#3bc9db" | "#15aabf" | "#0c8599" | "#e6fcf5" | "#96f2d7" | "#38d9a9" | "#12b886" | "#099268" | "#ebfbee" | "#b2f2bb" | "#69db7c" | "#40c057" | "#2f9e44" | "#fff9db" | "#ffec99" | "#ffd43b" | "#fab005" | "#f08c00" | "#fff4e6" | "#ffd8a8" | "#ffa94d" | "#fd7e14" | "#e8590c")[];
export declare const rgbToHex: (r: number, g: number, b: number, a?: number) => string;
/**
 * @returns the color with its alpha replaced by `alpha` (as #RRGGBBAA), or the
 *  input unchanged if it's not a valid color
 */
export declare const setColorAlpha: (color: string, alpha: number) => string;
/**
 * @returns #RRGGBB or #RRGGBBAA based on color containing non-opaque alpha,
 *  null if not valid color
 */
export declare const colorToHex: (color: string) => string | null;
export declare const isTransparent: (color: string) => boolean;
/**
 * Whether the color is fully opaque (alpha exactly 1).
 *
 * NOT the negation of `isTransparent`, which is true only at alpha 0 — a
 * partial-alpha color (`#RRGGBBAA`, `rgba(…, 0.5)`) is neither transparent
 * (it renders) nor opaque (what's beneath shows through it).
 */
export declare const isOpaqueColor: (color: string) => boolean;
export declare const COLOR_OUTLINE_CONTRAST_THRESHOLD = 240;
export declare const isColorDark: (color: string, threshold?: number) => boolean;
/**
 * tries to keep the input color as-is if it's valid, making minimal adjustments
 * (trimming whitespace or adding `#` to hex colors)
 */
export declare const normalizeInputColor: (color: string) => string | null;
