import type { Ellipse, GlobalPoint, Line, LineSegment, LocalPoint } from "./types";
/**
 * Construct an Ellipse object from the parameters
 *
 * @param center The center of the ellipse
 * @param angle The slanting of the ellipse in radians
 * @param halfWidth Half of the width of a non-slanted version of the ellipse
 * @param halfHeight Half of the height of a non-slanted version of the ellipse
 * @returns The constructed Ellipse object
 */
export declare function ellipse<Point extends GlobalPoint | LocalPoint>(center: Point, halfWidth: number, halfHeight: number): Ellipse<Point>;
/**
 * Determines if a point is inside or on the ellipse outline
 *
 * @param p The point to test
 * @param ellipse The ellipse to compare against
 * @returns TRUE if the point is inside or on the outline of the ellipse
 */
export declare const ellipseIncludesPoint: <Point extends GlobalPoint | LocalPoint>(p: Point, ellipse: Ellipse<Point>) => boolean;
/**
 * Tests whether a point lies on the outline of the ellipse within a given
 * tolerance
 *
 * @param point The point to test
 * @param ellipse The ellipse to compare against
 * @param threshold The distance to consider a point close enough to be "on" the outline
 * @returns TRUE if the point is on the ellise outline
 */
export declare const ellipseTouchesPoint: <Point extends GlobalPoint | LocalPoint>(point: Point, ellipse: Ellipse<Point>, threshold?: number) => boolean;
/**
 * Determine the shortest euclidean distance from a point to the
 * outline of the ellipse
 *
 * @param p The point to consider
 * @param ellipse The ellipse to calculate the distance to
 * @returns The eucledian distance
 */
export declare const ellipseDistanceFromPoint: <Point extends GlobalPoint | LocalPoint>(p: Point, ellipse: Ellipse<Point>) => number;
/**
 * Calculate a maximum of two intercept points for a line going throug an
 * ellipse.
 */
export declare function ellipseSegmentInterceptPoints<Point extends GlobalPoint | LocalPoint>(e: Readonly<Ellipse<Point>>, s: Readonly<LineSegment<Point>>): Point[];
export declare function ellipseLineIntersectionPoints<Point extends GlobalPoint | LocalPoint>({ center, halfWidth, halfHeight }: Ellipse<Point>, [g, h]: Line<Point>): Point[];
