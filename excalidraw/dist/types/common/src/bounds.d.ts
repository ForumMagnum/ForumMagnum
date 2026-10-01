/**
 * x and y position of top left corner, x and y position of bottom right corner
 */
export type Bounds = readonly [
    minX: number,
    minY: number,
    maxX: number,
    maxY: number
];
export declare const isBounds: (box: unknown) => box is Bounds;
