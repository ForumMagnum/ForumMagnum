import { AnimatedTrail } from "./animatedTrail";
import type { Trail } from "./animatedTrail";
import type App from "./components/App";
export declare class LaserTrails implements Trail {
    private app;
    localTrail: AnimatedTrail;
    private collabTrails;
    private container?;
    constructor(app: App);
    private getTrailOptions;
    startPath(x: number, y: number): void;
    addPointToPath(x: number, y: number): void;
    endPath(): void;
    start(container: SVGSVGElement): void;
    stop(): void;
    private stopCollabTrails;
    updateCollabTrails(collaborators: App["state"]["collaborators"]): void;
}
