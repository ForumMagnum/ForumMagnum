import { type GlobalPoint, type LocalPoint } from "../../math/src/index";
import type { ElementsMap, ExcalidrawBindableElement, ExcalidrawDiamondElement, ExcalidrawElement, ExcalidrawEllipseElement, ExcalidrawEmbeddableElement, ExcalidrawFrameLikeElement, ExcalidrawFreeDrawElement, ExcalidrawIframeElement, ExcalidrawImageElement, ExcalidrawLinearElement, ExcalidrawRectangleElement, ExcalidrawSelectionElement, ExcalidrawStickyNoteElement, ExcalidrawTextElement } from "../../element/src/types";
import type { Curve, LineSegment, Polygon, Radians } from "../../math/src/index";
import type { Drawable, Op } from "roughjs/bin/core";
export type Polyline<Point extends GlobalPoint | LocalPoint> = LineSegment<Point>[];
export type Polycurve<Point extends GlobalPoint | LocalPoint> = Curve<Point>[];
export type Ellipse<Point extends GlobalPoint | LocalPoint> = {
    center: Point;
    angle: Radians;
    halfWidth: number;
    halfHeight: number;
};
export type GeometricShape<Point extends GlobalPoint | LocalPoint> = {
    type: "line";
    data: LineSegment<Point>;
} | {
    type: "polygon";
    data: Polygon<Point>;
} | {
    type: "curve";
    data: Curve<Point>;
} | {
    type: "ellipse";
    data: Ellipse<Point>;
} | {
    type: "polyline";
    data: Polyline<Point>;
} | {
    type: "polycurve";
    data: Polycurve<Point>;
};
type RectangularElement = ExcalidrawRectangleElement | ExcalidrawStickyNoteElement | ExcalidrawDiamondElement | ExcalidrawFrameLikeElement | ExcalidrawEmbeddableElement | ExcalidrawImageElement | ExcalidrawIframeElement | ExcalidrawTextElement | ExcalidrawSelectionElement;
export declare const getPolygonShape: <Point extends GlobalPoint | LocalPoint>(element: RectangularElement) => GeometricShape<Point>;
export declare const getSelectionBoxShape: <Point extends GlobalPoint | LocalPoint>(element: ExcalidrawElement, elementsMap: ElementsMap, padding?: number) => GeometricShape<Point>;
export declare const getEllipseShape: <Point extends GlobalPoint | LocalPoint>(element: ExcalidrawEllipseElement) => GeometricShape<Point>;
export declare const getCurvePathOps: (shape: Drawable) => Op[];
export declare const getCurveShape: <Point extends GlobalPoint | LocalPoint>(roughShape: Drawable, startingPoint: Point | undefined, angleInRadian: Radians, center: Point) => GeometricShape<Point>;
export declare const getFreedrawShape: <Point extends GlobalPoint | LocalPoint>(element: ExcalidrawFreeDrawElement, center: Point, isClosed?: boolean) => GeometricShape<Point>;
export declare const getClosedCurveShape: <Point extends GlobalPoint | LocalPoint>(element: ExcalidrawLinearElement, roughShape: Drawable, startingPoint: Point | undefined, angleInRadian: Radians, center: Point) => GeometricShape<Point>;
/**
 * Determine intersection of a rectangular shaped element and a
 * line segment.
 *
 * @param element The rectangular element to test against
 * @param segment The segment intersecting the element
 * @param gap Optional value to inflate the shape before testing
 * @returns An array of intersections
 */
export declare const segmentIntersectRectangleElement: <Point extends LocalPoint | GlobalPoint>(element: ExcalidrawBindableElement, segment: LineSegment<Point>, gap?: number) => Point[];
export declare const pointOnEllipse: <Point extends LocalPoint | GlobalPoint>(point: Point, ellipse: Ellipse<Point>, threshold?: number) => boolean;
export declare const pointInEllipse: <Point extends LocalPoint | GlobalPoint>(p: Point, ellipse: Ellipse<Point>) => boolean;
export declare const ellipseAxes: <Point extends LocalPoint | GlobalPoint>(ellipse: Ellipse<Point>) => {
    majorAxis: number;
    minorAxis: number;
};
export declare const ellipseFocusToCenter: <Point extends LocalPoint | GlobalPoint>(ellipse: Ellipse<Point>) => number;
export declare const ellipseExtremes: <Point extends LocalPoint | GlobalPoint>(ellipse: Ellipse<Point>) => import("../../math/src/index").Vector[];
export {};
