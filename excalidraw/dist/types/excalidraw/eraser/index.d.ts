import { AnimatedTrail } from "../animatedTrail";
import type App from "../components/App";
export declare class EraserTrail extends AnimatedTrail {
    private elementsToErase;
    private groupsToErase;
    constructor(app: App);
    startPath(x: number, y: number): void;
    addPointToPath(x: number, y: number, restore?: boolean): string[];
    private updateElementsToBeErased;
    endPath(): void;
}
