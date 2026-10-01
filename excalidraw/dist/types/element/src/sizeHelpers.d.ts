import type { AppState, Offsets, Zoom } from "../../excalidraw/types";
import type { ElementsMap, ExcalidrawElement } from "./types";
export type VerticalResizeAnchor = "top" | "bottom" | "center";
/** Keeps the chosen edge or center fixed when an element's height changes. */
export declare const getPositionAfterHeightChange: (element: Pick<ExcalidrawElement, "x" | "y" | "height" | "angle">, nextHeight: number, anchor?: VerticalResizeAnchor) => {
    x: number;
    y: number;
};
export declare const INVISIBLY_SMALL_ELEMENT_SIZE = 0.1;
export declare const isInvisiblySmallElement: (element: ExcalidrawElement) => boolean;
export declare const isElementInViewport: (element: ExcalidrawElement, width: number, height: number, viewTransformations: {
    zoom: Zoom;
    offsetLeft: number;
    offsetTop: number;
    scrollX: number;
    scrollY: number;
}, elementsMap: ElementsMap) => boolean;
export declare const isElementCompletelyInViewport: (elements: ExcalidrawElement[], width: number, height: number, viewTransformations: {
    zoom: Zoom;
    offsetLeft: number;
    offsetTop: number;
    scrollX: number;
    scrollY: number;
}, elementsMap: ElementsMap, padding?: Offsets) => boolean;
/**
 * Makes a perfect shape or diagonal/horizontal/vertical line
 */
export declare const getPerfectElementSize: (elementType: AppState["activeTool"]["type"], width: number, height: number) => {
    width: number;
    height: number;
};
export declare const getLockedLinearCursorAlignSize: (originX: number, originY: number, x: number, y: number, customAngle?: number) => {
    width: number;
    height: number;
};
export declare const getNormalizedDimensions: (element: Pick<ExcalidrawElement, "width" | "height" | "x" | "y">) => {
    width: ExcalidrawElement["width"];
    height: ExcalidrawElement["height"];
    x: ExcalidrawElement["x"];
    y: ExcalidrawElement["y"];
};
