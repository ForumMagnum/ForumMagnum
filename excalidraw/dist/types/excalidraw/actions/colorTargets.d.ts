import type { ColorPaletteCustom, ColorTuple } from "../../common/src/index";
import type { ExcalidrawElement } from "../../element/src/types";
import type { AppState } from "../types";
export type ColorProperty = "strokeColor" | "backgroundColor";
/**
 * Sticky notes are their own color domain: own defaults, own top picks, no
 * transparent. A pick targets the regular domain, the sticky domain, or both
 * ("mixed" selections write both defaults and use the regular picker).
 */
export type ColorTargetKind = "regular" | "sticky" | "mixed";
export type ColorDefaultKey = "currentItemStrokeColor" | "currentItemBackgroundColor" | "currentItemStickynoteStrokeColor" | "currentItemStickynoteBackgroundColor";
export type ColorTargetAppState = Pick<AppState, "selectedElementIds" | "editingTextElement" | "activeTool" | ColorDefaultKey>;
export type ColorTarget = {
    kind: ColorTargetKind;
    property: ColorProperty;
    /** the current-item defaults a pick is written to (normalized per domain) */
    appStateKeys: readonly ColorDefaultKey[];
    /** the default shown when no element is targeted */
    currentValue: string;
    palette: ColorPaletteCustom;
    topPicks: ColorTuple;
    customizableTopPicks: keyof AppState["colorTopPicks"];
    excludedColors: readonly string[] | undefined;
};
/**
 * Who a stroke/background pick targets. Resolve it from the state an action
 * runs against, at execution time — never capture it in a render closure:
 * the memoized picker keeps a stale `onChange`, and the always-visible top
 * picks fire it without a re-render.
 *
 * Targets are the selected color-capable elements (for stroke incl. bound
 * labels, since a note's visible text is its label) plus the text being
 * edited (`handleTextWysiwyg` deselects while editing) — or, for a
 * background pick on a note's label, the note (see `getColorTargetElement`).
 * With no target, the active tool decides the domain.
 */
export declare const resolveColorTarget: (appState: ColorTargetAppState, elements: readonly ExcalidrawElement[], property: ColorProperty) => ColorTarget;
/** the current-item default updates for a picked color */
export declare const getColorTargetAppStateUpdates: (target: ColorTarget, color: string) => Partial<AppState>;
