import { type CombineBrandsIfNeeded } from "../../common/src/index";
import type { ElementsMap, ElementsMapOrArray, ExcalidrawElement, ExcalidrawSelectionElement, OrderedExcalidrawElement } from "../../element/src/types";
import type { AppState, BinaryFiles, LibraryItem } from "../types";
import type { ImportedDataState } from "./types";
type RestoredAppState = Omit<AppState, "offsetTop" | "offsetLeft" | "width" | "height">;
export declare const AllowedExcalidrawActiveTools: Record<AppState["activeTool"]["type"], boolean>;
export type RestoredDataState = {
    elements: OrderedExcalidrawElement[];
    appState: RestoredAppState;
    files: BinaryFiles;
};
export declare const restoreElement: (
/** element to be restored */
element: Exclude<ExcalidrawElement, ExcalidrawSelectionElement>, 
/** all elements to be restored */
targetElementsMap: Readonly<ElementsMap>, 
/** used for additional context */
existingElementsMap: Readonly<ElementsMap> | null | undefined, opts?: {
    deleteInvisibleElements?: boolean;
}) => typeof element | null;
export declare const restoreElements: <T extends ExcalidrawElement>(targetElements: readonly T[] | undefined | null, 
/** used for additional context (e.g. repairing arrow bindings) */
existingElements: Readonly<ElementsMapOrArray> | null | undefined, opts?: {
    refreshDimensions?: boolean;
    repairBindings?: boolean;
    deleteInvisibleElements?: boolean;
} | undefined) => CombineBrandsIfNeeded<T, OrderedExcalidrawElement>;
/**
 * When replacing elements that may exist locally, this bumps their versions
 * to the local version + 1. Mainly for later reconciliation to work properly.
 *
 * See https://github.com/excalidraw/excalidraw/issues/3795
 *
 * Generally use this on editor boundaries (importing from file etc.), though
 * it does not apply universally (e.g. we don't want to do this for collab
 * updates).
 */
export declare const bumpElementVersions: <T extends ExcalidrawElement>(targetElements: readonly T[], localElements: Readonly<ElementsMapOrArray> | null | undefined) => T[];
export declare const restoreAppState: (appState: ImportedDataState["appState"], localAppState: Partial<AppState> | null | undefined) => RestoredAppState;
export declare const restoreLibraryItems: (libraryItems: ImportedDataState["libraryItems"], defaultStatus: LibraryItem["status"]) => LibraryItem[];
export {};
