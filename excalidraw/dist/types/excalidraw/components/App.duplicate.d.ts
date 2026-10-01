import { duplicateElements } from "../../element/src/index";
import type { ExcalidrawElement } from "../../element/src/types";
import type { PointerDownState } from "../types";
import type App from "./App";
type Duplication = Pick<ReturnType<typeof duplicateElements>, "duplicatedElements" | "duplicateElementsMap" | "origElementsMap" | "origIdToDuplicateId" | "duplicateIdToOrigId">;
/**
 * Owns the duplication paths which involve the host (`props.onDuplicate`):
 * duplicating elements into the scene (paste, library insert etc.), and
 * duplicating the dragged selection (alt-drag). The duplicate action shares
 * `runOnDuplicate()`.
 */
export declare class AppDuplicate {
    private app;
    constructor(app: App);
    /**
     * Hands the duplication over to the host's `props.onDuplicate` (if any),
     * and reconciles what it returned with the duplicates.
     *
     * @returns next elements, and the duplicates that weren't vetoed
     */
    runOnDuplicate: (duplication: Duplication, nextElements: ExcalidrawElement[], 
    /** excludes the duplicated elements */
    prevElements: readonly ExcalidrawElement[]) => {
        elements: ExcalidrawElement[];
        duplicatedElements: import("../../element/src/types").NonDeletedExcalidrawElement[];
    };
    /**
     * Duplicates elements so that they end up centered at the scene coords
     * (and in the frame at that point, if any). Doesn't update the scene.
     *
     * @returns `null` if the host vetoed the duplication
     */
    duplicateAtSceneCoords: (elements: readonly ExcalidrawElement[], { x, y }: {
        x: number;
        y: number;
    }, opts?: {
        retainSeed?: boolean;
        preserveFrameChildrenOrder?: boolean;
    }) => {
        nextElements: ExcalidrawElement[];
        duplicatedElements: import("../../element/src/types").NonDeletedExcalidrawElement[];
    } | null;
    /**
     * Duplicates the selection being dragged: the originals go back to where
     * the drag started, and the drag continues with the duplicates.
     *
     * If the host vetoes the duplication, the originals keep being dragged.
     */
    duplicateDraggedSelection: (pointerDownState: PointerDownState, event: PointerEvent) => void;
}
export {};
