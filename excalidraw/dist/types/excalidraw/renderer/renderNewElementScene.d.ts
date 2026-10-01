import type { NewElementSceneRenderConfig } from "../scene/types";
export declare const renderNewElementSceneThrottled: {
    (config: NewElementSceneRenderConfig): void;
    flush(): void;
    cancel(): void;
};
export declare const renderNewElementScene: (renderConfig: NewElementSceneRenderConfig, throttle?: boolean) => void;
