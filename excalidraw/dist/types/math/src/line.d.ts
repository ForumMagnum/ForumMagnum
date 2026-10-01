import type { GlobalPoint, Line, LocalPoint } from "./types";
/**
 * Create a line from two points.
 *
 * @param points The two points lying on the line
 * @returns The line on which the points lie
 */
export declare function line<P extends GlobalPoint | LocalPoint>(a: P, b: P): Line<P>;
/**
 * Determines the intersection point (unless the lines are parallel) of two
 * lines
 *
 * @param a
 * @param b
 * @returns
 */
export declare function linesIntersectAt<Point extends GlobalPoint | LocalPoint>(a: Line<Point>, b: Line<Point>): Point | null;
