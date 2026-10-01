import type { AppState } from "../../excalidraw/types";
import type { Scene } from "./Scene";
import type { NonDeletedExcalidrawElement } from "./types";
export interface Alignment {
    position: "start" | "center" | "end";
    axis: "x" | "y";
}
export declare const alignElements: (selectedElements: NonDeletedExcalidrawElement[], alignment: Alignment, scene: Scene, appState: Readonly<AppState>) => NonDeletedExcalidrawElement[];
