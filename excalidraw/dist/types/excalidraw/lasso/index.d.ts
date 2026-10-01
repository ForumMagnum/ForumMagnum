import { AnimatedTrail } from "../animatedTrail";
import type App from "../components/App";
export declare class LassoTrail extends AnimatedTrail {
    private intersectedElements;
    private enclosedElements;
    private elementsSegments;
    private canvasTranslate;
    private keepPreviousSelection;
    constructor(app: App);
    startPath(x: number, y: number, keepPreviousSelection?: boolean): void;
    selectElementsFromIds: (ids: string[]) => void;
    addPointToPath: (x: number, y: number, keepPreviousSelection?: boolean) => void;
    private updateSelection;
    endPath(): void;
}
