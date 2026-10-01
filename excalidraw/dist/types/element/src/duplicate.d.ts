import type { Mutable } from "../../common/src/utility-types";
import type { AppState } from "../../excalidraw/types";
import type { ExcalidrawElement, GroupId, NonDeletedExcalidrawElement } from "./types";
/**
 * Lookups supplied to the host's `props.onDuplicate`, covering just the
 * elements taking part in the duplication.
 */
export type OnDuplicateData = {
    /** the duplicates, by their id */
    duplicateElements: ReadonlyMap<ExcalidrawElement["id"], ExcalidrawElement>;
    /**
     * The elements the duplicates were made from, by their id.
     *
     * On paste and library insert these are the inserted elements, which aren't
     * part of the scene (though they may share ids with the scene elements they
     * were copied from).
     */
    originalElements: ReadonlyMap<ExcalidrawElement["id"], ExcalidrawElement>;
    /**
     * id of an original -> id of its duplicate (e.g. to remap element ids you
     * keep in `customData`, which the duplicate copied from its original)
     */
    origIdToDuplicateId: ReadonlyMap<ExcalidrawElement["id"], ExcalidrawElement["id"]>;
    /**
     * id of a duplicate -> id of its original (e.g. to look up the original in
     * `originalElements` while modifying the duplicate)
     */
    duplicateIdToOrigId: ReadonlyMap<ExcalidrawElement["id"], ExcalidrawElement["id"]>;
};
/**
 * Duplicate an element, often used in the alt-drag operation.
 * Note that this method has gotten a bit complicated since the
 * introduction of gruoping/ungrouping elements.
 * @param editingGroupId The current group being edited. The new
 *                       element will inherit this group and its
 *                       parents.
 * @param groupIdMapForOperation A Map that maps old group IDs to
 *                               duplicated ones. If you are duplicating
 *                               multiple elements at once, share this map
 *                               amongst all of them
 * @param element Element to duplicate
 */
export declare const duplicateElement: <TElement extends ExcalidrawElement>(editingGroupId: AppState["editingGroupId"], groupIdMapForOperation: Map<GroupId, GroupId>, element: TElement, randomizeSeed?: boolean) => Readonly<TElement>;
export declare const duplicateElements: (opts: {
    elements: readonly ExcalidrawElement[];
    randomizeSeed?: boolean;
    overrides?: (data: {
        duplicateElement: ExcalidrawElement;
        origElement: ExcalidrawElement;
        origIdToDuplicateId: Map<ExcalidrawElement["id"], ExcalidrawElement["id"]>;
    }) => Partial<ExcalidrawElement>;
} & ({
    /**
     * Duplicates all elements in array.
     *
     * Use this when programmaticaly duplicating elements, without direct
     * user interaction.
     */
    type: "everything";
    preserveFrameChildrenOrder?: boolean;
} | {
    /**
     * Duplicates specified elements and inserts them back into the array
     * in specified order.
     *
     * Use this when duplicating Scene elements, during user interaction
     * such as alt-drag or on duplicate action.
     */
    type: "in-place";
    idsOfElementsToDuplicate: Map<ExcalidrawElement["id"], ExcalidrawElement>;
    appState: {
        editingGroupId: AppState["editingGroupId"];
        selectedGroupIds: AppState["selectedGroupIds"];
    };
})) => {
    duplicatedElements: NonDeletedExcalidrawElement[];
    duplicateElementsMap: Map<string, NonDeletedExcalidrawElement>;
    origElementsMap: Map<string, ExcalidrawElement>;
    elementsWithDuplicates: ExcalidrawElement[];
    origIdToDuplicateId: Map<string, string>;
    duplicateIdToOrigId: Map<string, string>;
};
/**
 * Folds the elements returned by the host (`props.onDuplicate`) back into the
 * duplicates the editor created, so that everything that follows (frame
 * assignment, bound text redraw, selection, alt-drag handover) can keep
 * working with the editor's own objects, whether the host mutated the
 * duplicates or returned new objects for them.
 *
 * - A returned element with a duplicate's id is shallow-merged into that
 *   duplicate, which takes its place in the returned array. Properties the
 *   host omits are kept, so that a partial element can't invalidate the
 *   duplicate. Safe only because the duplicates are fresh (not in the scene or
 *   the store snapshot yet), which is why nothing but the passed duplicates is
 *   ever merged into. Since the merge goes around `mutateElement`, what may
 *   have been cached for the duplicate by then is invalidated here.
 * - A duplicate missing from the returned array (or returned as deleted) is
 *   vetoed. So is the bound text of a vetoed container. What the remaining
 *   duplicates reference of the vetoed ones is cleared, as if those were never
 *   part of the duplication (see `fixDuplicatedBindingsAfterDuplication`).
 * - Any other returned element is used as is (existing elements must not be
 *   mutated, so the host replaces them).
 * - `false` vetoes all the duplicates.
 *
 * @returns next elements, and the duplicates that weren't vetoed
 */
export declare const reconcileDuplicatedElements: <TDuplicate extends ExcalidrawElement>(
/** what the host returned from `props.onDuplicate`, if anything */
hostElements: readonly ExcalidrawElement[] | void | false, 
/** elements that were passed to the host */
nextElements: ExcalidrawElement[], duplicatedElements: TDuplicate[]) => {
    elements: ExcalidrawElement[];
    duplicatedElements: TDuplicate[];
};
/**
 * Clones ExcalidrawElement data structure. Does not regenerate id, nonce, or
 * any value. The purpose is to to break object references for immutability
 * reasons, whenever we want to keep the original element, but ensure it's not
 * mutated.
 *
 * Only clones plain objects and arrays. Doesn't clone Date, RegExp, Map, Set,
 * Typed arrays and other non-null objects.
 */
export declare const deepCopyElement: <T extends ExcalidrawElement>(val: T) => Mutable<T>;
