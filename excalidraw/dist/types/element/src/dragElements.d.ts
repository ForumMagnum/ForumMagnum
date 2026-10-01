import type { AppState, NormalizedZoomValue, NullableGridSize, PointerDownState } from "../../excalidraw/types";
import type { NonDeletedExcalidrawElement } from "./types";
import type { Scene } from "./Scene";
import type { ExcalidrawTextElement } from "./types";
export declare const dragSelectedElements: (pointerDownState: PointerDownState, _selectedElements: NonDeletedExcalidrawElement[], offset: {
    x: number;
    y: number;
}, scene: Scene, snapOffset: {
    x: number;
    y: number;
}, gridSize: NullableGridSize) => void;
export declare const getDragOffsetXY: (selectedElements: NonDeletedExcalidrawElement[], x: number, y: number) => [number, number];
/**
 * Sizes a text element as it is dragged out.
 *
 * A dragged text pins one point and grows away from it; `anchorRatio` says
 * where along the box that point sits — 0 for its left edge, 1 for its right,
 * 0.5 for its centre.
 *
 * A free text pins the point the drag started from and takes the ratio from
 * the drag direction, so it can be pulled either way. A text bound to an arrow
 * endpoint instead pins whatever the binding placed it against and takes the
 * ratio from its alignment — which is also what keeps it from growing back
 * over the arrow, since dragging that way makes no progress rather than
 * flipping the box around.
 */
export declare const dragNewTextElement: ({ newElement, anchorX, anchorRatio, pointerX, nextY, zoom, scene, informMutation, }: {
    newElement: ExcalidrawTextElement;
    anchorX: number;
    /** 0 = anchored by its left edge, 1 = by its right, 0.5 = by its centre */
    anchorRatio: number;
    pointerX: number;
    /** free text re-tops itself to the drag origin; a bound one must not move */
    nextY?: number;
    zoom: NormalizedZoomValue;
    scene: Scene;
    informMutation?: boolean;
}) => void;
export declare const dragNewElement: ({ newElement, elementType, originX, originY, x, y, width, height, shouldMaintainAspectRatio, shouldResizeFromCenter, zoom, scene, widthAspectRatio, originOffset, informMutation, }: {
    newElement: NonDeletedExcalidrawElement;
    elementType: AppState["activeTool"]["type"];
    originX: number;
    originY: number;
    x: number;
    y: number;
    width: number;
    height: number;
    shouldMaintainAspectRatio: boolean;
    shouldResizeFromCenter: boolean;
    zoom: NormalizedZoomValue;
    scene: Scene;
    /** whether to keep given aspect ratio when `isResizeWithSidesSameLength` is
        true */
    widthAspectRatio?: number | null;
    originOffset?: {
        x: number;
        y: number;
    } | null;
    informMutation?: boolean;
}) => void;
