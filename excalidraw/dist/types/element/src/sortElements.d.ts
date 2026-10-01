import type { ExcalidrawElement } from "./types";
/**
 * In theory, when we have text elements bound to a container, they
 * should be right after the container element in the elements array.
 * However, this is not guaranteed due to old and potential future bugs.
 *
 * This function sorts containers and their bound texts together. It prefers
 * original z-index of container (i.e. it moves bound text elements after
 * containers).
 */
export declare const normalizeBoundElementsOrder: <T extends ExcalidrawElement>(elements: readonly T[]) => readonly T[];
export declare const normalizeElementOrder: (elements: readonly ExcalidrawElement[]) => readonly ExcalidrawElement[];
