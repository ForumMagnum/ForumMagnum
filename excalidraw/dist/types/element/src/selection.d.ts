import type { AppState, BoxSelectionMode, InteractiveCanvasAppState } from "../../excalidraw/types";
import { LinearElementEditor } from "./linearElementEditor";
import type { ElementsMap, ElementsMapOrArray, ExcalidrawElement, NonDeleted, NonDeletedExcalidrawElement } from "./types";
/**
 * Frames and their containing elements are not to be selected at the same time.
 * Given an array of selected elements, if there are frames and their containing elements
 * we only keep the frames.
 * @param selectedElements
 */
export declare const excludeElementsInFramesFromSelection: <T extends ExcalidrawElement>(selectedElements: readonly T[]) => T[];
export declare const getElementsWithinSelection: <T extends ExcalidrawElement>(elements: readonly T[], selection: ExcalidrawElement, elementsMap: ElementsMap, excludeElementsInFrames?: boolean, boxSelectionMode?: BoxSelectionMode) => T[];
export declare const getVisibleAndNonSelectedElements: <T extends NonDeletedExcalidrawElement>(elements: readonly T[], selectedElements: readonly ExcalidrawElement[], appState: AppState, elementsMap: ElementsMap) => T[];
export declare const isSomeElementSelected: {
    (elements: readonly NonDeletedExcalidrawElement[], appState: Pick<AppState, "selectedElementIds">): boolean;
    clearCache(): void;
};
export declare const getSelectedElements: (elements: ElementsMapOrArray, appState: Pick<InteractiveCanvasAppState, "selectedElementIds">, opts?: {
    includeBoundTextElement?: boolean;
    includeElementsInFrames?: boolean;
}) => NonDeletedExcalidrawElement[];
export declare const getTargetElements: (elements: ElementsMapOrArray, appState: Pick<AppState, "selectedElementIds" | "editingTextElement" | "newElement" | "activeTool">) => NonDeletedExcalidrawElement[] | import("./types").ExcalidrawTextElement[];
/**
 * returns prevState's selectedElementids if no change from previous, so as to
 * retain reference identity for memoization
 */
export declare const makeNextSelectedElementIds: (nextSelectedElementIds: AppState["selectedElementIds"], prevState: Pick<AppState, "selectedElementIds">) => Readonly<{
    [id: string]: true;
}>;
export declare const getSelectionStateForElements: (targetElements: readonly NonDeletedExcalidrawElement[], allElements: readonly NonDeletedExcalidrawElement[], appState: AppState) => {
    selectedElementIds: AppState["selectedElementIds"];
    selectedGroupIds: AppState["selectedGroupIds"];
    editingGroupId: AppState["editingGroupId"];
    selectedLinearElement: LinearElementEditor | null;
};
/**
 * Returns editing or single-selected text element, if any.
 */
export declare const getActiveTextElement: (selectedElements: readonly NonDeleted<ExcalidrawElement>[], appState: Pick<AppState, "editingTextElement">) => import("./types").ExcalidrawTextElement | null;
