import { type GlobalPoint, type LocalPoint, type LineSegment } from "../../math/src/index";
import { type Bounds } from "../../common/src/index";
import type { ElementsMap, ExcalidrawElement } from "./types";
import type { Curve } from "../../math/src/index";
declare global {
    interface Window {
        visualDebug?: {
            data: DebugElement[][];
            currentFrame?: number;
        };
    }
}
export type DebugElement = {
    color: string;
    data: LineSegment<GlobalPoint> | Curve<GlobalPoint> | DebugPolygon;
    permanent: boolean;
};
export type DebugPolygon = {
    type: "polygon";
    points: GlobalPoint[];
    fill?: boolean;
    close?: boolean;
};
export declare const debugDrawHitVolume: (element: ExcalidrawElement, elementsMap: ElementsMap, options?: {
    rays?: number;
    color?: string;
    fill?: boolean;
}) => void;
export declare const debugDrawCubicBezier: (c: Curve<GlobalPoint>, opts?: {
    color?: string;
    permanent?: boolean;
}) => void;
export declare const debugDrawLine: (segment: LineSegment<GlobalPoint> | LineSegment<GlobalPoint>[], opts?: {
    color?: string;
    permanent?: boolean;
}) => void;
export declare const debugDrawPolygon: (points: GlobalPoint[], opts?: {
    color?: string;
    permanent?: boolean;
    fill?: boolean;
    close?: boolean;
}) => void;
export declare const debugDrawPoint: (p: GlobalPoint, opts?: {
    color?: string;
    permanent?: boolean;
    fuzzy?: boolean;
}) => void;
export declare const debugDrawBounds: (box: Bounds | Bounds[], opts?: {
    color?: string;
    permanent?: boolean;
}) => void;
export declare const debugDrawPoints: ({ x, y, points, }: {
    x: number;
    y: number;
    points: readonly LocalPoint[];
}, options?: any) => void;
export declare const debugCloseFrame: () => void;
export declare const debugClear: () => void;
