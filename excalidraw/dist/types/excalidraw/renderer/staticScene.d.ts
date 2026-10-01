import type { ExcalidrawFrameLikeElement } from "../../element/src/types";
import type { StaticCanvasRenderConfig, StaticSceneRenderConfig } from "../scene/types";
import type { StaticCanvasAppState } from "../types";
export declare const frameClip: (frame: ExcalidrawFrameLikeElement, context: CanvasRenderingContext2D, renderConfig: StaticCanvasRenderConfig, appState: StaticCanvasAppState) => void;
/** throttled to animation framerate */
export declare const renderStaticSceneThrottled: {
    (config: StaticSceneRenderConfig): void;
    flush(): void;
    cancel(): void;
};
/**
 * Static scene is the non-ui canvas where we render elements.
 */
export declare const renderStaticScene: (renderConfig: StaticSceneRenderConfig, throttle?: boolean) => void;
