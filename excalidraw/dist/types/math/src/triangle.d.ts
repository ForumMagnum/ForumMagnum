import type { GlobalPoint, LocalPoint, Triangle } from "./types";
/**
 * Tests if a point lies inside a triangle. This function
 * will return FALSE if the point lies exactly on the sides
 * of the triangle.
 *
 * @param triangle The triangle to test the point for
 * @param p The point to test whether is in the triangle
 * @returns TRUE if the point is inside of the triangle
 */
export declare function triangleIncludesPoint<P extends GlobalPoint | LocalPoint>([a, b, c]: Triangle<P>, p: P): boolean;
