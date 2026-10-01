import type { AppClassProperties, AppState, InteractiveCanvasAppState } from "../../excalidraw/types";
import type { Mutable } from "../../common/src/utility-types";
import type { GroupId, ExcalidrawElement, NonDeleted, ElementsMapOrArray, ElementsMap, NonDeletedExcalidrawElement, NonDeletedElementsMapOrArray } from "./types";
export declare const selectGroup: (groupId: GroupId, appState: InteractiveCanvasAppState, elements: readonly NonDeletedExcalidrawElement[]) => Pick<InteractiveCanvasAppState, "selectedGroupIds" | "selectedElementIds" | "editingGroupId">;
export declare const selectGroupsForSelectedElements: {
    (appState: Pick<AppState, "selectedElementIds" | "editingGroupId">, elements: readonly NonDeletedExcalidrawElement[], prevAppState: InteractiveCanvasAppState, app: AppClassProperties | null): Mutable<Pick<InteractiveCanvasAppState, "selectedGroupIds" | "editingGroupId" | "selectedElementIds">>;
    clearCache(): void;
};
/**
 * If the element's group is selected, don't render an individual
 * selection border around it.
 */
export declare const isSelectedViaGroup: (appState: Pick<InteractiveCanvasAppState, "editingGroupId" | "selectedGroupIds">, element: ExcalidrawElement) => boolean;
export declare const getSelectedGroupForElement: (appState: Pick<InteractiveCanvasAppState, "editingGroupId" | "selectedGroupIds">, element: ExcalidrawElement) => string | undefined;
export declare const getSelectedGroupIds: (appState: Pick<InteractiveCanvasAppState, "selectedGroupIds">) => GroupId[];
export declare const selectGroupsFromGivenElements: (elements: readonly NonDeletedExcalidrawElement[], appState: InteractiveCanvasAppState) => {
    [groupId: string]: boolean;
};
export declare const editGroupForSelectedElement: (appState: AppState, element: NonDeleted<ExcalidrawElement>) => AppState;
export declare const isElementInGroup: (element: ExcalidrawElement, groupId: string) => boolean;
export declare const getElementsInGroup: <P extends NonDeletedExcalidrawElement | ExcalidrawElement>(elements: P extends NonDeletedExcalidrawElement ? NonDeletedElementsMapOrArray : ElementsMapOrArray, groupId: string) => P[];
export declare const getSelectedGroupIdForElement: (element: ExcalidrawElement, selectedGroupIds: {
    [groupId: string]: boolean;
}) => string | undefined;
export declare const addToGroup: (prevGroupIds: ExcalidrawElement["groupIds"], newGroupId: GroupId, editingGroupId: AppState["editingGroupId"]) => string[];
export declare const removeFromSelectedGroups: (groupIds: ExcalidrawElement["groupIds"], selectedGroupIds: {
    [groupId: string]: boolean;
}) => string[];
export declare const getMaximumGroups: <T extends NonDeletedExcalidrawElement | ExcalidrawElement>(elements: T[], elementsMap: ElementsMap) => T[][];
export declare const getNonDeletedGroupIds: (elements: ElementsMap) => Set<string>;
export declare const elementsAreInSameGroup: (elements: readonly ExcalidrawElement[]) => boolean;
export declare const isInGroup: (element: ExcalidrawElement) => boolean;
export declare const getNewGroupIdsForDuplication: (groupIds: ExcalidrawElement["groupIds"], editingGroupId: AppState["editingGroupId"], mapper: (groupId: GroupId) => GroupId) => string[];
export declare const getSelectedElementsByGroup: (selectedElements: NonDeletedExcalidrawElement[], elementsMap: ElementsMap, appState: Readonly<Pick<AppState, "selectedGroupIds" | "editingGroupId">>) => NonDeletedExcalidrawElement[][];
