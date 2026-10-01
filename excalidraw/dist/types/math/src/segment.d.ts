import type { GlobalPoint, LineSegment, LocalPoint, Radians } from "./types";
/**
 * Create a line segment from two points.
 *
 * @param points The two points delimiting the line segment on each end
 * @returns The line segment delineated by the points
 */
export declare function lineSegment<P extends GlobalPoint | LocalPoint>(a: P, b: P): LineSegment<P>;
/**
 *
 * @param segment
 * @returns
 */
export declare const isLineSegment: <Point extends GlobalPoint | LocalPoint>(segment: unknown) => segment is LineSegment<Point>;
/**
 * Return the coordinates resulting from rotating the given line about an origin by an angle in radians
 * note that when the origin is not given, the midpoint of the given line is used as the origin.
 *
 * @param l
 * @param angle
 * @param origin
 * @returns
 */
export declare const lineSegmentRotate: <Point extends LocalPoint | GlobalPoint>(l: LineSegment<Point>, angle: Radians, origin?: Point) => LineSegment<Point>;
/**
 * Calculates the point two line segments with a definite start and end point
 * intersect at.
 */
export declare const segmentsIntersectAt: <Point extends GlobalPoint | LocalPoint>(a: Readonly<LineSegment<Point>>, b: Readonly<LineSegment<Point>>) => Point | null;
export declare const pointOnLineSegment: <Point extends LocalPoint | GlobalPoint>(point: Point, line: LineSegment<Point>, threshold?: number) => boolean;
export declare const distanceToLineSegment: <Point extends LocalPoint | GlobalPoint>(point: Point, line: LineSegment<Point>) => number;
/**
 * Returns the point at parameter `t` along the segment, where `t = 0` is the
 * segment's start and `t = 1` its end. Not clamped.
 */
export declare function lineSegmentPointAt<Point extends GlobalPoint | LocalPoint>(line: LineSegment<Point>, t: number): Point;
/**
 * Returns the intersection point of a segment and a line
 *
 * @param l
 * @param s
 * @returns
 */
export declare function lineSegmentIntersectionPoints<Point extends GlobalPoint | LocalPoint>(l: LineSegment<Point>, s: LineSegment<Point>, threshold?: number): Point | null;
export declare function lineSegmentsDistance<Point extends GlobalPoint | LocalPoint>(s1: LineSegment<Point>, s2: LineSegment<Point>): number;
export declare function lineSegmentClosestParameter<Point extends GlobalPoint | LocalPoint>(point: Point, line: LineSegment<Point>): number;
