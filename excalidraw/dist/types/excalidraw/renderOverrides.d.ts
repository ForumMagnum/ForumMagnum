import type { ElementRenderOffsets, ElementRenderOverrides } from "./types";
/** Validate and copy before publishing, so a rejected snapshot changes nothing. */
export declare const copyElementRenderOverrides: (overrides: ElementRenderOverrides | null) => ElementRenderOverrides;
/**
 * Extracts the offsets of a snapshot, returning `previous` when they are the
 * same. Visibility is memoized on this map's identity, so a snapshot that only
 * changes opacities (a fade) never re-runs viewport geometry.
 */
export declare const getElementRenderOffsets: (overrides: ElementRenderOverrides, previous: ElementRenderOffsets) => ElementRenderOffsets;
