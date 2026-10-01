import type { GlobalPoint, LocalPoint, Vector } from "./types";
/**
 * Create a vector from the x and y coordiante elements.
 *
 * @param x The X aspect of the vector
 * @param y T Y aspect of the vector
 * @returns The constructed vector with X and Y as the coordinates
 */
export declare function vector(x: number, y: number, originX?: number, originY?: number): Vector;
/**
 * Turn a point into a vector with the origin point.
 *
 * @param p The point to turn into a vector
 * @param origin The origin point in a given coordiante system
 * @param threshold The threshold to consider the vector as 'undefined'
 * @param defaultValue The default value to return if the vector is 'undefined'
 * @returns The created vector from the point and the origin or default
 */
export declare function vectorFromPoint<Point extends GlobalPoint | LocalPoint>(p: Point, origin?: Point, threshold?: number, defaultValue?: Vector): Vector;
/**
 * Cross product is a binary operation on two vectors in 2D space.
 * It results in a vector that is perpendicular to both vectors.
 *
 * @param a One of the vectors to use for the directed area calculation
 * @param b The other vector to use for the directed area calculation
 * @returns The directed area value for the two vectos
 */
export declare function vectorCross(a: Vector, b: Vector): number;
/**
 * Dot product is defined as the sum of the products of the
 * two vectors.
 *
 * @param a One of the vectors for which the sum of products is calculated
 * @param b The other vector for which the sum of products is calculated
 * @returns The sum of products of the two vectors
 */
export declare function vectorDot(a: Vector, b: Vector): number;
/**
 * Determines if the value has the shape of a Vector.
 *
 * @param v The value to test
 * @returns TRUE if the value has the shape and components of a Vectors
 */
export declare function isVector(v: unknown): v is Vector;
/**
 * Add two vectors by adding their coordinates.
 *
 * @param a One of the vectors to add
 * @param b The other vector to add
 * @returns The sum vector of the two provided vectors
 */
export declare function vectorAdd(a: Readonly<Vector>, b: Readonly<Vector>): Vector;
/**
 * Add two vectors by adding their coordinates.
 *
 * @param start One of the vectors to add
 * @param end The other vector to add
 * @returns The sum vector of the two provided vectors
 */
export declare function vectorSubtract(start: Readonly<Vector>, end: Readonly<Vector>): Vector;
/**
 * Scale vector by a scalar.
 *
 * @param v The vector to scale
 * @param scalar The scalar to multiply the vector components with
 * @returns The new scaled vector
 */
export declare function vectorScale(v: Vector, scalar: number): Vector;
/**
 * Calculates the sqare magnitude of a vector. Use this if you compare
 * magnitudes as it saves you an SQRT.
 *
 * @param v The vector to measure
 * @returns The scalar squared magnitude of the vector
 */
export declare function vectorMagnitudeSq(v: Vector): number;
/**
 * Calculates the magnitude of a vector.
 *
 * @param v The vector to measure
 * @returns The scalar magnitude of the vector
 */
export declare function vectorMagnitude(v: Vector): number;
/**
 * Normalize the vector (i.e. make the vector magnitue equal 1).
 *
 * @param v The vector to normalize
 * @returns The new normalized vector
 */
export declare const vectorNormalize: (v: Vector) => Vector;
/**
 * Calculate the right-hand normal of the vector.
 */
export declare const vectorNormal: (v: Vector) => Vector;
