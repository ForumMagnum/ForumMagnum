import type { AppState } from "../../excalidraw/types";
import type { Scene } from "./Scene";
import type { ElementsMap, NonDeletedExcalidrawElement } from "./types";
export interface Distribution {
    space: "between";
    axis: "x" | "y";
}
export declare const distributeElements: (selectedElements: NonDeletedExcalidrawElement[], elementsMap: ElementsMap, distribution: Distribution, appState: Readonly<AppState>, scene: Scene) => NonDeletedExcalidrawElement[];
