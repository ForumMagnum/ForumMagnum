import { type GlobalPoint } from "../../../math/src/index";
import type { AppState, NullableGridSize } from "../../../excalidraw/types";
import { LinearElementEditor } from "../linearElementEditor";
import type { ElementsMap, ExcalidrawArrowElement, ExcalidrawBindableElement, FixedPointBinding, NonDeletedSceneElementsMap } from "../types";
import type { Scene } from "../Scene";
export declare const isFocusPointVisible: (focusPoint: GlobalPoint, arrow: ExcalidrawArrowElement, bindableElement: ExcalidrawBindableElement, elementsMap: ElementsMap, appState: {
    isBindingEnabled: AppState["isBindingEnabled"];
    zoom: AppState["zoom"];
}, startOrEnd: "start" | "end", ignoreOverlap?: boolean) => boolean;
export declare const handleFocusPointDrag: (linearElementEditor: LinearElementEditor, elementsMap: NonDeletedSceneElementsMap, pointerCoords: {
    x: number;
    y: number;
}, scene: Scene, appState: AppState, gridSize: NullableGridSize, switchToInsideBinding: boolean) => void;
export declare const handleFocusPointPointerDown: (arrow: ExcalidrawArrowElement, pointerDownState: {
    origin: {
        x: number;
        y: number;
    };
}, elementsMap: NonDeletedSceneElementsMap, appState: AppState) => {
    hitFocusPoint: "start" | "end" | null;
    pointerOffset: {
        x: number;
        y: number;
    };
    arrowOtherEndpointInitialBinding: FixedPointBinding | null;
};
export declare const handleFocusPointPointerUp: (linearElementEditor: LinearElementEditor, scene: Scene) => {
    arrowOtherEndpointInitialBinding: null;
};
export declare const handleFocusPointHover: (arrow: ExcalidrawArrowElement, scenePointerX: number, scenePointerY: number, scene: Scene, appState: AppState) => "start" | "end" | null;
