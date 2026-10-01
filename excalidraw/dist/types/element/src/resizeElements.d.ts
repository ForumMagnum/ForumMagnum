import { type LocalPoint } from "../../math/src/index";
import type { PointerDownState } from "../../excalidraw/types";
import type { Scene } from "./Scene";
import type { BoundingBox } from "./bounds";
import type { MaybeTransformHandleType, TransformHandleDirection } from "./transformHandles";
import type { ExcalidrawLinearElement, ExcalidrawTextElement, NonDeletedExcalidrawElement, NonDeleted, ElementsMap } from "./types";
export declare const transformElements: (originalElements: PointerDownState["originalElements"], transformHandleType: MaybeTransformHandleType, selectedElements: readonly NonDeletedExcalidrawElement[], scene: Scene, shouldRotateWithDiscreteAngle: boolean, shouldResizeFromCenter: boolean, shouldMaintainAspectRatio: boolean, pointerX: number, pointerY: number, centerX: number, centerY: number) => boolean;
export declare const rescalePointsInElement: (element: NonDeletedExcalidrawElement, width: number, height: number, normalizePoints: boolean) => {
    points: LocalPoint[];
} | {
    points?: undefined;
};
export declare const measureFontSizeFromWidth: (element: NonDeleted<ExcalidrawTextElement>, elementsMap: ElementsMap, nextWidth: number) => {
    size: number;
} | null;
export declare const resizeSingleTextElement: (origElement: NonDeleted<ExcalidrawTextElement>, element: NonDeleted<ExcalidrawTextElement>, scene: Scene, transformHandleType: TransformHandleDirection, shouldResizeFromCenter: boolean, nextWidth: number, nextHeight: number) => void;
export declare const getResizeOffsetXY: (transformHandleType: MaybeTransformHandleType, selectedElements: NonDeletedExcalidrawElement[], elementsMap: ElementsMap, x: number, y: number) => [number, number];
export declare const getResizeArrowDirection: (transformHandleType: MaybeTransformHandleType, element: NonDeleted<ExcalidrawLinearElement>) => "origin" | "end";
export declare const resizeSingleElement: (nextWidth: number, nextHeight: number, latestElement: NonDeletedExcalidrawElement, origElement: NonDeletedExcalidrawElement, originalElementsMap: ElementsMap, scene: Scene, handleDirection: TransformHandleDirection, { shouldInformMutation, shouldMaintainAspectRatio, shouldResizeFromCenter, }?: {
    shouldMaintainAspectRatio?: boolean;
    shouldResizeFromCenter?: boolean;
    shouldInformMutation?: boolean;
}) => void;
export declare const resizeMultipleElements: (selectedElements: readonly NonDeletedExcalidrawElement[], elementsMap: ElementsMap, handleDirection: TransformHandleDirection, scene: Scene, originalElementsMap: ElementsMap, { shouldMaintainAspectRatio, shouldResizeFromCenter, flipByX, flipByY, nextHeight, nextWidth, originalBoundingBox, }?: {
    nextWidth?: number;
    nextHeight?: number;
    shouldMaintainAspectRatio?: boolean;
    shouldResizeFromCenter?: boolean;
    flipByX?: boolean;
    flipByY?: boolean;
    originalBoundingBox?: BoundingBox;
}) => void;
