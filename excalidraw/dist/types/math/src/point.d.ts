import type { LocalPoint, GlobalPoint, Radians, Degrees, Vector, GlobalCoord, LocalCoord } from "./types";
/**
 * Create a properly typed Point instance from the X and Y coordinates.
 *
 * @param x The X coordinate
 * @param y The Y coordinate
 * @returns The branded and created point
 */
export declare function pointFrom<Point extends GlobalPoint | LocalPoint>(x: number, y: number): Point;
export declare function pointFrom<Coord extends GlobalCoord | LocalCoord>(coords: Coord): Coord extends GlobalCoord ? GlobalPoint : LocalPoint;
export declare function pointFrom<Point extends GlobalPoint | LocalPoint>(coords: {
    x: number;
    y: number;
}): Point;
/**
 * Converts and remaps an array containing a pair of numbers to Point.
 *
 * @param numberArray The number array to check and to convert to Point
 * @returns The point instance
 */
export declare function pointFromArray<Point extends GlobalPoint | LocalPoint>(numberArray: number[]): Point | undefined;
/**
 * Converts and remaps a pair of numbers to Point.
 *
 * @param pair A number pair to convert to Point
 * @returns The point instance
 */
export declare function pointFromPair<Point extends GlobalPoint | LocalPoint>(pair: [number, number]): Point;
/**
 * Convert a vector to a point.
 *
 * @param v The vector to convert
 * @returns The point the vector points at with origin 0,0
 */
export declare function pointFromVector<P extends GlobalPoint | LocalPoint>(v: Vector, offset?: P): P;
/**
 * Checks if the provided value has the shape of a Point.
 *
 * @param p The value to attempt verification on
 * @returns TRUE if the provided value has the shape of a local or global point
 */
export declare function isPoint(p: unknown): p is LocalPoint | GlobalPoint;
/**
 * Compare two points coordinate-by-coordinate and if
 * they are closer than INVERSE_PRECISION it returns TRUE.
 *
 * @param a Point The first point to compare
 * @param b Point The second point to compare
 * @returns TRUE if the points are sufficiently close to each other
 */
export declare function pointsEqual<Point extends GlobalPoint | LocalPoint>(a: Point, b: Point, tolerance?: number): boolean;
/**
 * Rotate a point by [angle] radians.
 *
 * @param point The point to rotate
 * @param center The point to rotate around, the center point
 * @param angle The radians to rotate the point by
 * @returns The rotated point
 */
export declare function pointRotateRads<Point extends GlobalPoint | LocalPoint>(point: Point, center: Point, angle: Radians): Point;
/**
 * Rotate a point by [angle] degree.
 *
 * @param point The point to rotate
 * @param center The point to rotate around, the center point
 * @param angle The degree to rotate the point by
 * @returns The rotated point
 */
export declare function pointRotateDegs<Point extends GlobalPoint | LocalPoint>(point: Point, center: Point, angle: Degrees): Point;
/**
 * Translate a point by a vector.
 *
 * WARNING: This is not for translating Excalidraw element points!
 *          You need to account for rotation on base coordinates
 *          on your own.
 *          CONSIDER USING AN APPROPRIATE ELEMENT-AWARE TRANSLATE!
 *
 * @param p The point to apply the translation on
 * @param v The vector to translate by
 * @returns
 */
export declare function pointTranslate<From extends GlobalPoint | LocalPoint, To extends GlobalPoint | LocalPoint>(p: From, v?: Vector): To;
/**
 * Find the center point at equal distance from both points.
 *
 * @param a One of the points to create the middle point for
 * @param b The other point to create the middle point for
 * @returns The middle point
 */
export declare function pointCenter<P extends LocalPoint | GlobalPoint>(a: P, b: P): P;
/**
 * Calculate the distance between two points.
 *
 * @param a First point
 * @param b Second point
 * @returns The euclidean distance between the two points.
 */
export declare function pointDistance<P extends LocalPoint | GlobalPoint>(a: P, b: P): number;
/**
 * Calculate the squared distance between two points.
 *
 * Note: Use this if you only compare distances, it saves a square root.
 *
 * @param a First point
 * @param b Second point
 * @returns The euclidean distance between the two points.
 */
export declare function pointDistanceSq<P extends LocalPoint | GlobalPoint>(a: P, b: P): number;
/**
 * Scale a point from a given origin by the multiplier.
 *
 * @param p The point to scale
 * @param mid The origin to scale from
 * @param multiplier The scaling factor
 * @returns
 */
export declare const pointScaleFromOrigin: <P extends GlobalPoint | LocalPoint>(p: P, mid: P, multiplier: number) => GlobalPoint | LocalPoint;
/**
 * Returns whether `q` lies inside the segment/rectangle defined by `p` and `r`.
 * This is an approximation to "does `q` lie on a segment `pr`" check.
 *
 * @param p The first point to compare against
 * @param q The actual point this function checks whether is in between
 * @param r The other point to compare against
 * @returns TRUE if q is indeed between p and r
 */
export declare const isPointWithinBounds: <P extends GlobalPoint | LocalPoint>(p: P, q: P, r: P) => boolean;
export declare const isValidPoint: (point: unknown) => point is LocalPoint;
