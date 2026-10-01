import type { GlobalPoint } from "../math/src/index";
import type App from "./components/App";
import type { Trail } from "./animatedTrail";
export declare class DrawShapeTrail implements Trail {
    private app;
    private trail;
    constructor(app: App);
    private getTrailOptions;
    startPath(x: number, y: number): void;
    addPointToPath(x: number, y: number): void;
    endPath(): void;
    clearTrails(): void;
    getCurrentPoints(): GlobalPoint[];
    start(container: SVGSVGElement): void;
    stop(): void;
}
