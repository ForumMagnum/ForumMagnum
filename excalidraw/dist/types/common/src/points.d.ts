import { type GlobalPoint, type LocalPoint } from "../../math/src/index";
import type { NullableGridSize } from "../../excalidraw/types";
export declare const getSizeFromPoints: (points: readonly (GlobalPoint | LocalPoint)[]) => {
    width: number;
    height: number;
};
/** @arg dimension, 0 for rescaling only x, 1 for y */
export declare const rescalePoints: <Point extends GlobalPoint | LocalPoint>(dimension: 0 | 1, newSize: number, points: readonly Point[], normalize: boolean) => Point[];
export declare const getGridPoint: (x: number, y: number, gridSize: NullableGridSize) => GlobalPoint;
