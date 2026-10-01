export declare const PRECISION = 0.0001;
export declare const clamp: (value: number, min: number, max: number) => number;
export declare const round: (value: number, precision: number, func?: "round" | "floor" | "ceil") => number;
export declare const roundToStep: (value: number, step: number, func?: "round" | "floor" | "ceil") => number;
export declare const average: (a: number, b: number) => number;
export declare const isFiniteNumber: (value: any) => value is number;
export declare const isCloseTo: (a: number, b: number, precision?: number) => boolean;
