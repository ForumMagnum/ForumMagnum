import type { Curve, GlobalPoint, LineSegment, LocalPoint } from "./types";
/**
 *
 * @param a
 * @param b
 * @param c
 * @param d
 * @returns
 */
export declare function curve<Point extends GlobalPoint | LocalPoint>(a: Point, b: Point, c: Point, d: Point): Curve<Point>;
export declare const bezierEquation: <Point extends GlobalPoint | LocalPoint>(c: Curve<Point>, t: number) => Point;
/**
 * Computes the intersection between a cubic spline and a line segment.
 */
export declare function curveIntersectLineSegment<Point extends GlobalPoint | LocalPoint>(c: Curve<Point>, l: LineSegment<Point>, opts?: {
    tolerance?: number;
    iterLimit?: number;
}): Point[];
/**
 * Finds the parameter on the Bezier curve whose point is closest to another
 * point
 *
 * @param c The curve to test
 * @param p The point to measure from
 * @param tolerance The width of the search window under which the bisection
 *   stops refining the parameter
 */
export declare function curveClosestParameter<Point extends GlobalPoint | LocalPoint>(c: Curve<Point>, p: Point, tolerance?: number): number;
/**
 * Finds the closest point on the Bezier curve from another point
 *
 * @param c The curve to test
 * @param p The point to measure from
 * @param tolerance The width of the search window under which the bisection
 *   stops refining the parameter
 */
export declare function curveClosestPoint<Point extends GlobalPoint | LocalPoint>(c: Curve<Point>, p: Point, tolerance?: number): Point;
/**
 * Determines the distance between a point and the closest point on the
 * Bezier curve.
 *
 * @param c The curve to test
 * @param p The point to measure from
 */
export declare function curvePointDistance<Point extends GlobalPoint | LocalPoint>(c: Curve<Point>, p: Point, tolerance?: number): number;
/**
 * Determines if the parameter is a Curve
 */
export declare function isCurve<P extends GlobalPoint | LocalPoint>(v: unknown): v is Curve<P>;
export declare function curveTangent<Point extends GlobalPoint | LocalPoint>([p0, p1, p2, p3]: Curve<Point>, t: number): import("./types").Vector;
export declare function curveCatmullRomQuadraticApproxPoints(points: GlobalPoint[], tension?: number): [GlobalPoint, GlobalPoint][] | undefined;
export declare function curveCatmullRomCubicApproxPoints<Point extends GlobalPoint | LocalPoint>(points: Point[], tension?: number): Curve<Point>[] | undefined;
export declare function curveOffsetPoints([p0, p1, p2, p3]: Curve<GlobalPoint>, offset: number, steps?: number): GlobalPoint[];
export declare function offsetPointsForQuadraticBezier(p0: GlobalPoint, p1: GlobalPoint, p2: GlobalPoint, offsetDist: number, steps?: number): GlobalPoint[];
/**
 * Implementation based on Legendre-Gauss quadrature for more accurate arc
 * length calculation.
 *
 * Reference: https://pomax.github.io/bezierinfo/#arclength
 *
 * @param c The curve to calculate the length of
 * @returns The approximated length of the curve
 */
export declare function curveLength<P extends GlobalPoint | LocalPoint>(c: Curve<P>): number;
/**
 * Calculates the curve length from t=0 to t=parameter using the same
 * Legendre-Gauss quadrature method used in curveLength
 *
 * @param c The curve to calculate the partial length for
 * @param t The parameter value (0 to 1) to calculate length up to
 * @returns The length of the curve from beginning to parameter t
 */
export declare function curveLengthAtParameter<P extends GlobalPoint | LocalPoint>(c: Curve<P>, t: number): number;
/**
 * Calculates the point at a specific percentage of a curve's total length
 * using binary search for improved efficiency and accuracy.
 *
 * @param c The curve to calculate point on
 * @param percent A value between 0 and 1 representing the percentage of the curve's length
 * @returns The point at the specified percentage of curve length
 */
export declare function curvePointAtLength<P extends GlobalPoint | LocalPoint>(c: Curve<P>, percent: number, 
/** pass the curve's total length when already known to skip recomputing it */
totalLength?: number): P;
