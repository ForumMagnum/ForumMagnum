import type { App, AppState } from "../../excalidraw/types";
import type { LocalPoint, GlobalPoint } from "../../math/src/index";
import type { Bounds } from "../../common/src/index";
import type { ExcalidrawArrowElement, ExcalidrawDiamondElement, ExcalidrawElement, ExcalidrawEllipseElement, ExcalidrawFreeDrawElement, ExcalidrawFrameLikeElement, ExcalidrawRectangleElement, ElementsMap, NonDeleted, ExcalidrawLineElement } from "./types";
declare global {
    interface Window {
        LAST_POINTS?: readonly GlobalPoint[];
    }
}
type NonDeletedRecognizedShapeElement = NonDeleted<ExcalidrawRectangleElement | ExcalidrawEllipseElement | ExcalidrawDiamondElement | ExcalidrawArrowElement | ExcalidrawLineElement | ExcalidrawFreeDrawElement>;
type Shape = NonDeletedRecognizedShapeElement["type"];
interface ShapeRecognitionResult<P extends LocalPoint | GlobalPoint> {
    type: Shape;
    points: readonly P[];
    boundingBox: Bounds;
}
export declare const recognizeShape: <P extends LocalPoint | GlobalPoint>(points: P[], previousElement: ExcalidrawElement | null, zoom?: number) => ShapeRecognitionResult<P>;
export declare const convertToShape: (points: GlobalPoint[], appState: AppState, elementsMap: ElementsMap, previousElement: ExcalidrawElement | null, frames?: readonly ExcalidrawFrameLikeElement[]) => NonDeletedRecognizedShapeElement | undefined;
export declare const convertToShapeHandlePointerMoveFromPointerDown: (app: App, pointerCoords: {
    x: number;
    y: number;
}) => boolean;
export {};
