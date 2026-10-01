import { type GeometricShape } from "../../utils/src/shape";
import { type LocalPoint } from "../../math/src/index";
import type { GlobalPoint, Polygon } from "../../math/src/index";
import type { AppState, EmbedsValidationStatus } from "../../excalidraw/types";
import type { ElementShape, ElementShapes } from "../../excalidraw/scene/types";
import type { ExcalidrawElement, ExcalidrawSelectionElement, ExcalidrawLinearElement, ExcalidrawFreeDrawElement, ElementsMap, ExcalidrawLineElement } from "./types";
import type { Drawable, Options } from "roughjs/bin/core";
export declare class ShapeCache {
    private static rg;
    private static cache;
    /**
     * Retrieves shape from cache if available. Use this only if shape
     * is optional and you have a fallback in case it's not cached.
     */
    static get: <T extends ExcalidrawElement>(element: T, theme: AppState["theme"] | null) => (T["type"] extends keyof ElementShapes ? ElementShapes[T["type"]] | undefined : ElementShape | undefined) | undefined;
    static delete: (element: ExcalidrawElement) => void;
    static destroy: () => void;
    /**
     * Generates & caches shape for element if not already cached, otherwise
     * returns cached shape.
     */
    static generateElementShape: <T extends Exclude<ExcalidrawElement, ExcalidrawSelectionElement>>(element: T, renderConfig: {
        isExporting: boolean;
        canvasBackgroundColor: AppState["viewBackgroundColor"];
        embedsValidationStatus: EmbedsValidationStatus;
        theme: AppState["theme"];
    } | null) => ((T["type"] extends keyof ElementShapes ? ElementShapes[T["type"]] | undefined : ElementShape | undefined) & {}) | (T["type"] extends keyof ElementShapes ? ElementShapes[T["type"]] : Drawable | null);
}
export declare const generateRoughOptions: (element: ExcalidrawElement, continuousPath?: boolean, isDarkMode?: boolean) => Options;
/**
 * Returns the flattened fill contour of a freedraw loop in local, unrotated
 * coordinates, following the rendered fill rather than the stroke outline.
 */
export declare const getFreedrawFillPolygon: (element: ExcalidrawFreeDrawElement) => Polygon<LocalPoint>;
export declare const generateLinearCollisionShape: (element: ExcalidrawLinearElement | ExcalidrawFreeDrawElement, elementsMap: ElementsMap) => {
    op: string;
    data: number[];
}[];
/**
 * get the pure geometric shape of an excalidraw elementw
 * which is then used for hit detection
 */
export declare const getElementShape: <Point extends GlobalPoint | LocalPoint>(element: ExcalidrawElement, elementsMap: ElementsMap) => GeometricShape<Point>;
export declare const toggleLinePolygonState: (element: ExcalidrawLineElement, nextPolygonState: boolean) => {
    polygon: ExcalidrawLineElement["polygon"];
    points: ExcalidrawLineElement["points"];
} | null;
export declare const getFreedrawOutlinePoints: (element: ExcalidrawFreeDrawElement) => [number, number][];
/**
 * Upper bound on how far a freedraw stroke's ink reaches past its centerline
 * points. Both stroke generators scale the stroke size by at most 1 (easing
 * or pressure), so the size itself bounds the radius, except for
 * perfect-freehand's short strokes: under 3px long, the start cap is drawn
 * around the first point from an outline point of the last one (reaching
 * sqrt(size² + 3²)), and a single point gets a synthetic neighbor 1px away.
 */
export declare const getFreedrawMaxStrokeRadius: (element: ExcalidrawFreeDrawElement) => number;
/**
 * The streamline-smoothed centerline the freedraw stroke is rendered
 * around, in element-local coordinates. Boundary-sensitive consumers (e.g.
 * bucket fill) should use this instead of `element.points`: raw input
 * points can sit 20px+ apart and the rendered stroke is smoothed between
 * them, so raw chords visibly deviate from what's on screen.
 *
 * Constant-width ("laser geometry") strokes technically smooth via
 * `LaserPointer` instead; the perfect-freehand centerline with the same
 * `streamline` is a close approximation the stroke width hides.
 */
export declare const getFreedrawStrokeCenterPoints: (element: ExcalidrawFreeDrawElement) => [number, number][];
