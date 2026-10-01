import type { AppState, InputDevice, NormalizedZoomValue } from "./types";
export declare const getDefaultAppState: () => Omit<AppState, "offsetTop" | "offsetLeft" | "width" | "height">;
export declare const clearAppStateForLocalStorage: (appState: Partial<AppState>) => {
    name?: string | null | undefined;
    zoom?: Readonly<{
        value: NormalizedZoomValue;
    }> | undefined;
    activeTool?: ({
        lastActiveTool: import("./types").ActiveTool | null;
        locked: boolean;
        fromSelection: boolean;
    } & import("./types").ActiveTool) | undefined;
    zenModeEnabled?: boolean | undefined;
    gridModeEnabled?: boolean | undefined;
    objectsSnapModeEnabled?: boolean | undefined;
    theme?: import("../element/src/types").Theme | undefined;
    currentItemArrowType?: "round" | "sharp" | "elbow" | undefined;
    gridSize?: number | undefined;
    showWelcomeScreen?: boolean | undefined;
    isBindingEnabled?: boolean | undefined;
    boxSelectionMode?: import("./types").BoxSelectionMode | undefined;
    bindingPreference?: "enabled" | "disabled" | undefined;
    isMidpointSnappingEnabled?: boolean | undefined;
    showHints?: boolean | undefined;
    inputDevice?: InputDevice | undefined;
    preferredSelectionTool?: {
        type: "selection" | "lasso";
        initialized: boolean;
    } | undefined;
    penMode?: boolean | undefined;
    penDetected?: boolean | undefined;
    exportBackground?: boolean | undefined;
    exportEmbedScene?: boolean | undefined;
    exportWithDarkMode?: boolean | undefined;
    exportScale?: number | undefined;
    currentItemStrokeColor?: string | undefined;
    currentItemStickynoteStrokeColor?: string | undefined;
    currentItemStickynoteBackgroundColor?: string | undefined;
    currentItemBackgroundColor?: string | undefined;
    currentItemFillStyle?: import("../element/src/types").FillStyle | undefined;
    currentItemStrokeWidthKey?: import("../common/src/index").StrokeWidthKey | undefined;
    currentItemStrokeStyle?: import("../element/src/types").StrokeStyle | undefined;
    currentItemRoughness?: number | undefined;
    currentItemStrokeVariability?: import("../element/src/types").StrokeVariability | undefined;
    currentItemOpacity?: number | undefined;
    currentItemFontFamily?: number | undefined;
    currentItemFontSize?: number | undefined;
    currentItemTextAlign?: string | undefined;
    currentItemStartArrowhead?: import("../element/src/types").Arrowhead | null | undefined;
    currentItemEndArrowhead?: import("../element/src/types").Arrowhead | null | undefined;
    currentItemRoundness?: import("../element/src/types").StrokeRoundness | undefined;
    viewBackgroundColor?: string | undefined;
    scrollX?: number | undefined;
    scrollY?: number | undefined;
    cursorButton?: "up" | "down" | undefined;
    scrolledOutside?: boolean | undefined;
    openMenu?: "canvas" | null | undefined;
    openSidebar?: {
        name: import("./types").SidebarName;
        tab?: import("./types").SidebarTabName;
    } | null | undefined;
    defaultSidebarDockedPreference?: boolean | undefined;
    lastPointerDownWith?: import("../element/src/types").PointerType | undefined;
    selectedElementIds?: Readonly<{
        [id: string]: true;
    }> | undefined;
    previousSelectedElementIds?: {
        [id: string]: true;
    } | undefined;
    shouldCacheIgnoreZoom?: boolean | undefined;
    gridStep?: number | undefined;
    selectedGroupIds?: {
        [groupId: string]: boolean;
    } | undefined;
    editingGroupId?: string | null | undefined;
    stats?: {
        open: boolean;
        panels: number;
    } | undefined;
    selectedLinearElement?: import("../element/src/index").LinearElementEditor | null | undefined;
    lockedMultiSelections?: {
        [groupId: string]: true;
    } | undefined;
    bindMode?: import("../element/src/types").BindMode | undefined;
    colorTopPicks?: {
        elementStroke: readonly string[] | null;
        elementBackground: readonly string[] | null;
        bucketFill: readonly string[] | null;
        stickyNoteStroke: readonly string[] | null;
        stickyNoteBackground: readonly string[] | null;
    } | undefined;
    fontTopPicks?: readonly number[] | null | undefined;
};
export declare const cleanAppStateForExport: (appState: Partial<AppState>) => {
    gridModeEnabled?: boolean | undefined;
    gridSize?: number | undefined;
    viewBackgroundColor?: string | undefined;
    gridStep?: number | undefined;
    lockedMultiSelections?: {
        [groupId: string]: true;
    } | undefined;
};
export declare const clearAppStateForDatabase: (appState: Partial<AppState>) => {
    gridModeEnabled?: boolean | undefined;
    gridSize?: number | undefined;
    viewBackgroundColor?: string | undefined;
    gridStep?: number | undefined;
    lockedMultiSelections?: {
        [groupId: string]: true;
    } | undefined;
};
export declare const isEraserActive: ({ activeTool, }: {
    activeTool: AppState["activeTool"];
}) => boolean;
export declare const isHandToolActive: ({ activeTool, }: {
    activeTool: AppState["activeTool"];
}) => boolean;
/**
 * The device the wheel mappings follow for the given preference.
 *
 * `auto` is meant to detect the device from the wheel events themselves
 * (line vs. pixel delta modes, whole vs. fractional deltas, one vs. two axes
 * moving, event cadence and momentum tails). That is not implemented yet, so
 * it resolves to `trackpad` — the mapping the editor has always had, and the
 * default to keep until detection exists.
 */
export declare const resolveInputDevice: (inputDevice: InputDevice) => Exclude<InputDevice, "auto">;
