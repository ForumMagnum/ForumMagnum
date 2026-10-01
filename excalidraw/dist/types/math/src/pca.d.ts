import type { GlobalPoint, LocalPoint, Vector } from "./types";
/**
 * The principal axes of a point set, i.e. the eigen decomposition of its
 * 2x2 covariance matrix.
 *
 * The axes are orthonormal and ordered by variance, so `major` is the
 * direction along which the points spread the most. Together with `centroid`
 * they define a canonical frame: expressing the points in it removes
 * translation and rotation, and dividing by `sqrt(majorVariance)` removes
 * scale.
 */
export type PrincipalAxes<Point extends GlobalPoint | LocalPoint> = {
    centroid: Point;
    /** Unit vector along the direction of largest variance. */
    major: Vector;
    /** Unit vector along the direction of smallest variance, normal to major. */
    minor: Vector;
    /** Variance along `major` (the larger eigenvalue, λ₁). */
    majorVariance: number;
    /** Variance along `minor` (the smaller eigenvalue, λ₂). */
    minorVariance: number;
};
/**
 * A point expressed in a principal axes frame: `u` along the major axis,
 * `v` along the minor axis, both relative to the centroid.
 */
export type PrincipalCoords = [u: number, v: number];
/**
 * Compute the centroid of a point set.
 */
export declare function centroid<Point extends GlobalPoint | LocalPoint>(points: readonly Point[]): Point;
/**
 * Principal component analysis of a 2D point set.
 *
 * Computes the centroid and the eigen decomposition of the covariance matrix
 * [[μ20, μ11], [μ11, μ02]].
 *
 * @param points At least two points; fewer leaves the axes degenerate.
 * @returns The centroid, the orthonormal axes and their variances.
 */
export declare function principalAxes<Point extends GlobalPoint | LocalPoint>(points: readonly Point[]): PrincipalAxes<Point>;
/**
 * Express points in the frame of the given principal axes, making the point
 * cloud rotation, scale and translation invariant.
 */
export declare function principalCoords<Point extends GlobalPoint | LocalPoint>(points: readonly Point[], axes: PrincipalAxes<Point>, scale?: number): PrincipalCoords[];
/**
 * Flip the major axis so that it points toward the denser end of the point
 * cloud, resolving the 180° sign ambiguity of the eigenvector.
 *
 * @returns The axes with `major`/`minor` flipped if needed. Variances are
 * unchanged, as they are invariant to axis sign.
 */
export declare function orientPrincipalAxes<Point extends GlobalPoint | LocalPoint>(points: readonly Point[], axes: PrincipalAxes<Point>): PrincipalAxes<Point>;
/**
 * Ratio of the minor to the major variance in [0, 1]
 *
 * @returns 0 is a perfectly straight stroke, 1 is a stroke with no preferred
 * direction.
 */
export declare function elongation<Point extends GlobalPoint | LocalPoint>(axes: PrincipalAxes<Point>): number;
/**
 * The `order`-th standardized moment of a sample in a rotation and scale
 * invariant way (sandardizing by sigma).
 *
 * @returns 0 for a degenerate (zero variance) sample.
 */
export declare function standardizedMoment(values: readonly number[], order: number): number;
/**
 * Third standardized moment: how lopsided a sample is.
 *
 */
export declare function skewness(values: readonly number[]): number;
/**
 * Fourth standardized moment: how the mass is split between the tails and the
 * middle of a sample. Not excess kurtosis, a normal sample gives 3.
 *
 */
export declare function kurtosis(values: readonly number[]): number;
