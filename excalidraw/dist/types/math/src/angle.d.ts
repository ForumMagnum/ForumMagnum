import type { Degrees, GlobalPoint, LocalPoint, PolarCoords, Radians } from "./types";
export declare const normalizeRadians: (angle: Radians) => Radians;
/**
 * Return the polar coordinates for the given cartesian point represented by
 * (x, y) for the center point 0,0 where the first number returned is the radius,
 * the second is the angle in radians.
 */
export declare const cartesian2Polar: <P extends GlobalPoint | LocalPoint>([x, y,]: P) => PolarCoords;
export declare function degreesToRadians(degrees: Degrees): Radians;
export declare function radiansToDegrees(degrees: Radians): Degrees;
/**
 * Determines if the provided angle is a right angle.
 *
 * @param rads The angle to measure
 * @returns TRUE if the provided angle is a right angle
 */
export declare function isRightAngleRads(rads: Radians): boolean;
export declare function radiansBetweenAngles(a: Radians, min: Radians, max: Radians): boolean;
export declare function radiansDifference(a: Radians, b: Radians): Radians;
