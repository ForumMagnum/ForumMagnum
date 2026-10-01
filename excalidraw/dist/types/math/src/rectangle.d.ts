import type { GlobalPoint, LineSegment, LocalPoint, Rectangle } from "./types";
export declare function rectangle<P extends GlobalPoint | LocalPoint>(topLeft: P, bottomRight: P): Rectangle<P>;
export declare function rectangleFromNumberSequence<Point extends LocalPoint | GlobalPoint>(minX: number, minY: number, maxX: number, maxY: number): Rectangle<Point>;
export declare function rectangleIntersectLineSegment<Point extends LocalPoint | GlobalPoint>(r: Rectangle<Point>, l: LineSegment<Point>): Point[];
export declare function rectangleIntersectRectangle<Point extends LocalPoint | GlobalPoint>(rectangle1: Rectangle<Point>, rectangle2: Rectangle<Point>): boolean;
