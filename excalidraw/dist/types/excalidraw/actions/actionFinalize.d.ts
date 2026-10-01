import type { ExcalidrawElement } from "../../element/src/types";
import type { AppState } from "../types";
type FormData = {
    event: PointerEvent;
    sceneCoords: {
        x: number;
        y: number;
    };
    hitBoundText?: boolean;
};
export declare const actionFinalize: import("./types").Action<FormData> & {
    keyTest?: ((event: React.KeyboardEvent | KeyboardEvent, appState: AppState, elements: readonly ExcalidrawElement[], app: import("../types").AppClassProperties) => boolean) | undefined;
};
export {};
