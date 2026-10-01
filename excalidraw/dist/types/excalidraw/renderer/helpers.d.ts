import type { StaticCanvasRenderConfig } from "../scene/types";
import type { AppState, StaticCanvasAppState } from "../types";
export declare const DEFAULT_SELECTION_COLOR = "#6965db";
/**
 * Returns the theme's selection color (`--color-selection`), read from the
 * computed style of any element inside the editor container so that host
 * overrides are respected. Falls back to the default when unavailable.
 */
export declare const getSelectionColor: (element: Element | null | undefined) => string;
export declare const fillCircle: (context: CanvasRenderingContext2D, cx: number, cy: number, radius: number, stroke: boolean, fill?: boolean) => void;
/**
 * The scroll the renderers draw at: the real one, rounded to whole device
 * pixels. Panning writes a fractional scroll (pointer delta ÷ zoom), and an
 * element's cached bitmap blitted at a fractional device offset gets
 * resampled — so as the fraction drifts under a pan, every element pulses
 * between crisp and soft. A whole-pixel scroll moves the scene the way a
 * browser scrolls a page: each element keeps its own, constant sub-pixel
 * phase and a pan never changes how anything is filtered. The difference
 * stays under half a device pixel, so hit-testing and DOM overlays keep
 * using the real scroll. Identity when nothing needs to change.
 */
export declare const snapScrollToDevicePixels: <T extends {
    scrollX: number;
    scrollY: number;
    zoom: {
        value: number;
    };
}>(appState: T, scale: number) => T;
export declare const getNormalizedCanvasDimensions: (canvas: HTMLCanvasElement, scale: number) => [number, number];
export declare const bootstrapCanvas: ({ canvas, scale, normalizedWidth, normalizedHeight, theme, isExporting, viewBackgroundColor, }: {
    canvas: HTMLCanvasElement;
    scale: number;
    normalizedWidth: number;
    normalizedHeight: number;
    theme?: AppState["theme"];
    isExporting?: StaticCanvasRenderConfig["isExporting"];
    viewBackgroundColor?: StaticCanvasAppState["viewBackgroundColor"];
}) => CanvasRenderingContext2D;
export declare const strokeRectWithRotation_simple: (context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, cx: number, cy: number, angle: number, fill?: boolean, 
/** should account for zoom */
radius?: number) => void;
