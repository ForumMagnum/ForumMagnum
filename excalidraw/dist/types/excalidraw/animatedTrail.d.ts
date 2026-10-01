import { LaserPointer } from "../laser-pointer/src/index";
import type { LaserPointerOptions } from "../laser-pointer/src/index";
import type App from "./components/App";
export interface Trail {
    start(container: SVGSVGElement): void;
    stop(): void;
    startPath(x: number, y: number): void;
    addPointToPath(x: number, y: number): void;
    endPath(): void;
}
export interface AnimatedTrailOptions {
    fill: (trail: AnimatedTrail) => string;
    stroke?: (trail: AnimatedTrail) => string;
    animateTrail?: boolean;
}
export declare class AnimatedTrail implements Trail {
    protected app: App;
    private options;
    private currentTrail?;
    private pastTrails;
    private container?;
    private trailElement;
    private trailAnimation?;
    private key;
    private static counter;
    constructor(app: App, options: Partial<LaserPointerOptions> & Partial<AnimatedTrailOptions>);
    get hasCurrentTrail(): boolean;
    hasLastPoint(x: number, y: number): boolean;
    private cleanup;
    start(container?: SVGSVGElement): void;
    stop(): void;
    startPath(x: number, y: number): void;
    addPointToPath(x: number, y: number): void;
    endPath(): void;
    getCurrentTrail(): LaserPointer | undefined;
    clearTrails(): void;
    private update;
    private onFrame;
    private drawTrail;
}
