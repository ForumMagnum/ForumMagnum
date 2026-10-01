import { type EditorInterface } from "../../common/src/index";
import type { GlobalPoint, LocalPoint } from "../../math/src/index";
import type { AppState, Zoom } from "../../excalidraw/types";
import type { Bounds } from "../../common/src/index";
import type { MaybeTransformHandleType } from "./transformHandles";
import type { ExcalidrawElement, PointerType, NonDeletedExcalidrawElement, ElementsMap } from "./types";
export declare const resizeTest: <Point extends GlobalPoint | LocalPoint>(element: NonDeletedExcalidrawElement, elementsMap: ElementsMap, appState: AppState, x: number, y: number, zoom: Zoom, pointerType: PointerType, editorInterface: EditorInterface) => MaybeTransformHandleType;
export declare const getElementWithTransformHandleType: (elements: readonly NonDeletedExcalidrawElement[], appState: AppState, scenePointerX: number, scenePointerY: number, zoom: Zoom, pointerType: PointerType, elementsMap: ElementsMap, editorInterface: EditorInterface) => {
    element: NonDeletedExcalidrawElement;
    transformHandleType: MaybeTransformHandleType;
} | null;
export declare const getTransformHandleTypeFromCoords: <Point extends GlobalPoint | LocalPoint>([x1, y1, x2, y2]: Bounds, scenePointerX: number, scenePointerY: number, zoom: Zoom, pointerType: PointerType, editorInterface: EditorInterface) => MaybeTransformHandleType;
export declare const getCursorForResizingElement: (resizingElement: {
    element?: ExcalidrawElement;
    transformHandleType: MaybeTransformHandleType;
}) => string;
