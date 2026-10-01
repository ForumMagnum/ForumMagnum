import type { Point } from "./math";
export type SizeMappingDetails = {
    pressure: number;
    runningLength: number;
    currentIndex: number;
    totalLength: number;
};
export type LaserPointerOptions = {
    /** @default 2 */
    size: number;
    streamline: number;
    simplify: number;
    simplifyPhase: "tail" | "output" | "input";
    keepHead: boolean;
    sizeMapping: (details: SizeMappingDetails) => number;
};
export declare class LaserPointer {
    static defaults: LaserPointerOptions;
    static constants: {
        cornerDetectionMaxAngle: number;
        cornerDetectionVariance: (s: number) => 1 | 0.5;
        maxTailLength: number;
    };
    options: LaserPointerOptions;
    constructor(options: Partial<LaserPointerOptions>);
    originalPoints: Point[];
    private stablePoints;
    private tailPoints;
    private isFresh;
    private get lastPoint();
    addPoint(point: Point): void;
    close(): void;
    stabilizeTail(): void;
    private getSize;
    getStrokeOutline(sizeOverride?: number | undefined): Point[];
}
