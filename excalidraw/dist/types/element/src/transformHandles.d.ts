import { type EditorInterface } from "../../common/src/index";
import type { Radians } from "../../math/src/index";
import type { InteractiveCanvasAppState, Zoom } from "../../excalidraw/types";
import type { Bounds } from "../../common/src/index";
import type { ElementsMap, ExcalidrawElement, NonDeletedExcalidrawElement, PointerType } from "./types";
export type TransformHandleDirection = "n" | "s" | "w" | "e" | "nw" | "ne" | "sw" | "se";
export type TransformHandleType = TransformHandleDirection | "rotation";
export type TransformHandle = Bounds;
export type TransformHandles = Partial<{
    [T in TransformHandleType]: TransformHandle;
}>;
export type MaybeTransformHandleType = TransformHandleType | false;
export declare const DEFAULT_OMIT_SIDES: {
    e: boolean;
    s: boolean;
    n: boolean;
    w: boolean;
};
export declare const OMIT_SIDES_FOR_MULTIPLE_ELEMENTS: {
    e: boolean;
    s: boolean;
    n: boolean;
    w: boolean;
};
export declare const OMIT_SIDES_FOR_FRAME: {
    e: boolean;
    s: boolean;
    n: boolean;
    w: boolean;
    rotation: boolean;
};
export declare const canResizeFromSides: (editorInterface: EditorInterface) => boolean;
export declare const getOmitSidesForEditorInterface: (editorInterface: EditorInterface) => {};
export declare const getTransformHandlesFromCoords: ([x1, y1, x2, y2, cx, cy]: [number, number, number, number, number, number], angle: Radians, zoom: Zoom, pointerType: PointerType, omitSides?: { [T in TransformHandleType]?: boolean; }, margin?: number, spacing?: number) => TransformHandles;
export declare const getTransformHandles: (element: ExcalidrawElement, zoom: Zoom, elementsMap: ElementsMap, pointerType?: PointerType, omitSides?: { [T in TransformHandleType]?: boolean; }) => TransformHandles;
export declare const hasBoundingBox: (elements: readonly NonDeletedExcalidrawElement[], appState: InteractiveCanvasAppState, editorInterface: EditorInterface) => boolean;
