import { getScrollBars } from "../scene/scrollbars";
import type { InteractiveSceneRenderConfig } from "../scene/types";
declare const _renderInteractiveScene: ({ app, canvas, elementsMap, visibleElements, selectedElements, allElementsMap, scale, appState: unsnappedAppState, renderConfig, editorInterface, animationState, deltaTime, }: InteractiveSceneRenderConfig) => {
    scrollBars?: ReturnType<typeof getScrollBars>;
    animationState?: typeof animationState;
};
/**
 * Interactive scene is the ui-canvas where we render bounding boxes, selections
 * and other ui stuff.
 */
export declare const renderInteractiveScene: <U extends typeof _renderInteractiveScene>(renderConfig: InteractiveSceneRenderConfig) => ReturnType<U>;
export {};
