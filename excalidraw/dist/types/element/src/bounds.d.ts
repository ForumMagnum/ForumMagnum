import { type Bounds } from "../../common/src/index";
import type { Degrees, GlobalPoint, LineSegment, LocalPoint } from "../../math/src/index";
import type { AppState } from "../../excalidraw/types";
import type { Drawable, Op } from "roughjs/bin/core";
import type { Arrowhead, ElementsMap, ElementsMapOrArray, ExcalidrawElement, ExcalidrawLinearElement, NonDeleted, NonDeletedExcalidrawElement } from "./types";
export type RectangleBox = {
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;
};
export type SceneBounds = readonly [
    sceneX: number,
    sceneY: number,
    sceneX2: number,
    sceneY2: number
];
export declare class ElementBounds {
    private static boundsCache;
    private static nonRotatedBoundsCache;
    static getBounds(element: ExcalidrawElement, elementsMap: ElementsMap, nonRotated?: boolean): Bounds;
    private static calculateBounds;
}
export declare const getElementAbsoluteCoords: (element: ExcalidrawElement, elementsMap: ElementsMap, includeBoundText?: boolean) => [number, number, number, number, number, number];
/**
 * Given an element, return the line segments that make up the element.
 *
 * Uses helpers from /math
 */
export declare const getElementLineSegments: (element: ExcalidrawElement, elementsMap: ElementsMap) => LineSegment<GlobalPoint>[];
/**
 * Scene -> Scene coords, but in x1,x2,y1,y2 format.
 *
 * Rectangle here means any rectangular frame, not an excalidraw element.
 */
export declare const getRectangleBoxAbsoluteCoords: (boxSceneCoords: RectangleBox) => number[];
export declare const getDiamondPoints: (element: ExcalidrawElement) => number[];
export declare const getCubicBezierCurveBound: (p0: GlobalPoint, p1: GlobalPoint, p2: GlobalPoint, p3: GlobalPoint) => Bounds;
export declare const getMinMaxXYFromCurvePathOps: (ops: Op[], transformXY?: (p: GlobalPoint) => GlobalPoint) => Bounds;
export declare const getBoundsFromPoints: <P extends GlobalPoint | LocalPoint>(points: readonly P[], padding?: number) => Bounds;
/** @returns number in pixels */
export declare const getArrowheadSize: (arrowhead: Arrowhead) => number;
/** @returns number in degrees */
export declare const getArrowheadAngle: (arrowhead: Arrowhead) => Degrees;
export declare const getArrowheadPoints: (element: ExcalidrawLinearElement, shape: Drawable[], position: "start" | "end", arrowhead: Arrowhead, offsetMultiplier?: number) => number[] | null;
export declare const getElementBounds: (element: ExcalidrawElement, elementsMap: ElementsMap, nonRotated?: boolean) => Bounds;
export declare const getCommonBounds: (elements: ElementsMapOrArray, elementsMap?: ElementsMap) => Bounds;
export declare const getDraggedElementsBounds: (elements: readonly NonDeletedExcalidrawElement[], dragOffset: {
    x: number;
    y: number;
}) => number[];
export declare const getResizedElementAbsoluteCoords: (element: ExcalidrawElement, nextWidth: number, nextHeight: number, normalizePoints: boolean) => Bounds;
export declare const getElementPointsCoords: (element: ExcalidrawLinearElement, points: readonly (readonly [number, number])[]) => Bounds;
export interface BoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    midX: number;
    midY: number;
    width: number;
    height: number;
}
export declare const getCommonBoundingBox: (elements: readonly ExcalidrawElement[] | readonly NonDeleted<ExcalidrawElement>[]) => BoundingBox;
/**
 * returns scene coords of user's editor viewport (visible canvas area) bounds
 */
export declare const getVisibleSceneBounds: ({ scrollX, scrollY, width, height, zoom, }: AppState) => SceneBounds;
export declare const getCenterForBounds: (bounds: Bounds) => GlobalPoint;
/**
 * Get the axis-aligned bounding box for a given element
 */
export declare const aabbForElement: (element: Readonly<ExcalidrawElement>, elementsMap: ElementsMap, offset?: [number, number, number, number]) => Bounds;
export declare const pointInsideBounds: <P extends GlobalPoint | LocalPoint>(p: P, bounds: Bounds) => boolean;
export declare const pointInsideBoundsInclusive: <P extends GlobalPoint | LocalPoint>(p: P, bounds: Bounds) => boolean;
export declare const doBoundsIntersect: (bounds1: Bounds | null, bounds2: Bounds | null) => boolean;
export declare const boundsContainBounds: (outerBounds: Bounds, innerBounds: Bounds) => boolean;
/**
 * High level helper to get elements overlapping a bounding box.
 * It can be used to get elements overlapping a selection box, for example.
 *
 */
export declare const elementsOverlappingBBox: <T extends ExcalidrawElement>({ elements, elementsMap, bounds, type, excludeElementsInFrames, shouldIgnoreElementFromSelection, }: {
    elements: readonly T[];
    elementsMap?: ElementsMap;
    bounds: Bounds | ExcalidrawElement;
    /**
     * - overlap: elements overlapping or inside bounds
     * - contain: elements inside bounds
     **/
    type: "contain" | "overlap";
    excludeElementsInFrames?: boolean;
    shouldIgnoreElementFromSelection?: (element: T) => boolean;
}) => T[];
export declare const elementCenterPoint: (element: ExcalidrawElement, elementsMap: ElementsMap, xOffset?: number, yOffset?: number) => GlobalPoint;
