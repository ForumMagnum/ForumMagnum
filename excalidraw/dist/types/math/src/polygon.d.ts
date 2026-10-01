import type { GlobalPoint, LocalPoint, Polygon } from "./types";
export declare function polygon<Point extends GlobalPoint | LocalPoint>(...points: Point[]): Polygon<Point>;
export declare function polygonFromPoints<Point extends GlobalPoint | LocalPoint>(points: Point[]): Polygon<Point>;
export declare const polygonIncludesPoint: <Point extends LocalPoint | GlobalPoint>(point: Point, polygon: Polygon<Point>) => boolean;
export declare const polygonIncludesPointNonZero: <Point extends [number, number]>(point: Point, polygon: Point[]) => boolean;
export declare function polygonIsClosed<Point extends LocalPoint | GlobalPoint>(polygon: readonly Point[], tolerance?: number): boolean;
/**
 * The signed area of a polygon via the shoelace formula. Positive when the
 * vertices wind counter-clockwise in a y-down coordinate system.
 *
 * The polygon may be given open or closed; a closing vertex
 */
export declare function polygonSignedArea<Point extends LocalPoint | GlobalPoint>(polygon: readonly Point[], tolerance?: number): number;
export declare function polygonArea<Point extends LocalPoint | GlobalPoint>(polygon: readonly Point[], tolerance?: number): number;
/**
 * The convex hull of a point set via Andrew's monotone chain.
 *
 * @returns The hull vertices in counter-clockwise order (y-down), without a
 * repeated closing vertex.
 */
export declare function convexHull<Point extends LocalPoint | GlobalPoint>(points: readonly Point[]): Point[];
/**
 * Drop the points of a convex polygon that only contribute a shallow turn,
 * merging each run of near-collinear points into one.
 *
 * @param polygon A convex polygon, as returned by `convexHull`.
 * @param angleThreshold Minimum accumulated turn (radians) for a vertex to be
 * kept.
 */
export declare function simplifyConvexPolygon<Point extends LocalPoint | GlobalPoint>(polygon: readonly Point[], angleThreshold: number): Point[];
