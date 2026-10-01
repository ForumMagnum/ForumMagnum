import type { ElementsMap, ExcalidrawElement, Ordered, OrderedExcalidrawElement, SceneElementsMap } from "./types";
export declare class InvalidFractionalIndexError extends Error {
    code: "ELEMENT_HAS_INVALID_INDEX";
}
/**
 * Envisioned relation between array order and fractional indices:
 *
 * 1) Array (or array-like ordered data structure) should be used as a cache of elements order, hiding the internal fractional indices implementation.
 * - it's undesirable to perform reorder for each related operation, therefore it's necessary to cache the order defined by fractional indices into an ordered data structure
 * - it's easy enough to define the order of the elements from the outside (boundaries), without worrying about the underlying structure of fractional indices (especially for the host apps)
 * - it's necessary to always keep the array support for backwards compatibility (restore) - old scenes, old libraries, supporting multiple excalidraw versions etc.
 * - it's necessary to always keep the fractional indices in sync with the array order
 * - elements with invalid indices should be detected and synced, without altering the already valid indices
 *
 * 2) Fractional indices should be used to reorder the elements, whenever the cached order is expected to be invalidated.
 * - as the fractional indices are encoded as part of the elements, it opens up possibilities for incremental-like APIs
 * - re-order based on fractional indices should be part of (multiplayer) operations such as reconciliation & undo/redo
 * - technically all the z-index actions could perform also re-order based on fractional indices,but in current state it would not bring much benefits,
 *   as it's faster & more efficient to perform re-order based on array manipulation and later synchronisation of moved indices with the array order
 */
/**
 * Ensure that all elements have valid fractional indices.
 *
 * @throws `InvalidFractionalIndexError` if invalid index is detected.
 */
export declare const validateFractionalIndices: (elements: readonly ExcalidrawElement[], { shouldThrow, includeBoundTextValidation, ignoreLogs, reconciliationContext, }: {
    shouldThrow: boolean;
    includeBoundTextValidation: boolean;
    ignoreLogs?: true;
    reconciliationContext?: {
        localElements: ReadonlyArray<ExcalidrawElement>;
        remoteElements: ReadonlyArray<ExcalidrawElement>;
    };
}) => void;
/**
 * Order the elements based on the fractional indices.
 * - when fractional indices are identical, break the tie based on the element id
 * - when there is no fractional index in one of the elements, respect the order of the array
 */
export declare const orderByFractionalIndex: (elements: OrderedExcalidrawElement[]) => OrderedExcalidrawElement[];
/**
 * Synchronizes invalid fractional indices of moved elements with the array order by mutating passed elements.
 * If the synchronization fails or the result is invalid, it fallbacks to `syncInvalidIndices`.
 */
export declare const syncMovedIndices: (elements: readonly ExcalidrawElement[], movedElements: ElementsMap) => OrderedExcalidrawElement[];
/**
 * Synchronizes all invalid fractional indices within the array order by mutating elements in the passed array.
 *
 * WARN: in edge cases it could modify the elements which were not moved, as it's impossible to guess the actually moved elements from the elements array itself.
 */
export declare const syncInvalidIndices: <T extends ExcalidrawElement>(elements: readonly T[]) => Ordered<T>[];
/**
 * Synchronizes all invalid fractional indices within the array order by creating new instances of elements with corrected indices.
 *
 * WARN: in edge cases it could modify the elements which were not moved, as it's impossible to guess the actually moved elements from the elements array itself.
 */
export declare const syncInvalidIndicesImmutable: (elements: readonly ExcalidrawElement[]) => SceneElementsMap | undefined;
