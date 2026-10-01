import type { SceneBounds } from "../element/src/index";
import type { Bounds } from "../common/src/index";
import type { ExcalidrawElement } from "../element/src/types";
import type { AppState, NormalizedZoomValue, Offsets, PointerCoords, ScrollConstraints, ViewportOffsets, Zoom } from "./types";
/** default rubberband overscroll give for scroll locks, in viewport px */
export declare const DEFAULT_OVERSCROLL = 150;
type ZoomOptions = {
    viewportX: number;
    viewportY: number;
    nextZoom: NormalizedZoomValue;
};
export type AnimationOptions = {
    duration?: number;
};
export type SetViewportRect = {
    x: number;
    y: number;
    width?: number;
    height?: number;
};
export type SetViewportOptions = {
    /**
     * what to show in the viewport: an explicit scene-coordinate box/rect,
     * element(s), or an element id / element-link URL.
     *
     * IMPORTANT: if supplying ExcalidrawElement(s), only non-deleted elements
     * that actually exist on the canvas are considered. If you want to navigate
     * to elements that's not on canvas yet, supply their bounds by using
     * `getCommonBounds` (see {@link getCommonBounds}).
     */
    target: Bounds | SetViewportRect | ExcalidrawElement | readonly ExcalidrawElement[] | string;
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/object-fit
     *
     * - `scale-down` - zoom out so the target fits the viewport, never zooming past 100%
     * - `contain` - zoom the target so it fills the viewport (may exceed 100%)
     * - `none` - keep the current zoom, only center the target in the viewport
     */
    fit?: "scale-down" | "contain" | "none";
    lock?: {
        /** constraints panning to the target box */
        scroll?: ScrollConstraints["lockScroll"];
        /** makes the resolved zoom the minimum zoom */
        zoom?: ScrollConstraints["lockZoom"];
        /**
         * Rubberband give past the lock, in viewport px (zoom-independent): how
         * far the user can pan beyond the constraint before snapping back.
         * `true` (default) uses {@link DEFAULT_OVERSCROLL}, `false` disables
         * (rigid lock), a number sets the give explicitly.
         */
        overscroll?: boolean | number;
    };
    animation?: AnimationOptions | boolean;
    /**
     * CSS-style per-side viewport insets, in viewport pixels
     * (zoom-independent) — static values, editor-UI-derived (`ui`), or a
     * combination. See {@link ViewportOffsets}.
     */
    offsets?: ViewportOffsets;
};
type Viewport = Pick<AppState, "scrollX" | "scrollY" | "zoom">;
/**
 * Clamps a proposed scroll/zoom against the active lock (`scrollConstraints`).
 * Returns the input scroll/zoom unchanged when there is no lock.
 * `overscroll` (screen px, zoom-independent) is rubberband give past the
 * resting clamp — pass 0 for a hard clamp.
 */
export declare const constrainScrollState: (state: Pick<AppState, "scrollX" | "scrollY" | "zoom" | "width" | "height" | "scrollConstraints">, overscroll?: number) => Viewport;
/**
 * Resolves a focal-point zoom against the active scroll constraints while
 * preserving the current rubberband displacement in screen pixels. This lets
 * zoom and scroll-constraint snap-back compose without either visually
 * cancelling the other.
 */
export declare const getViewportForZoomWithScrollConstraints: (opts: ZoomOptions, state: AppState) => Viewport;
export declare const zoomToFitBounds: ({ bounds, appState, canvasOffsets, fit, minZoom, maxZoom, steppedZoom, }: {
    bounds: SceneBounds;
    canvasOffsets?: Offsets;
    appState: Readonly<AppState>;
    fit?: SetViewportOptions["fit"];
    minZoom?: number;
    maxZoom?: number;
    steppedZoom?: boolean;
}) => {
    appState: {
        scrollX: number;
        scrollY: number;
        zoom: {
            value: NormalizedZoomValue;
        };
        contextMenu: {
            items: import("./components/ContextMenu").ContextMenuItems;
            top: number;
            left: number;
        } | null;
        showWelcomeScreen: boolean;
        isLoading: boolean;
        errorMessage: React.ReactNode;
        activeEmbeddable: {
            element: import("../element/src/types").NonDeletedExcalidrawElement;
            state: "hover" | "active";
        } | null;
        newElement: import("../element/src/types").NonDeleted<import("../element/src/types").ExcalidrawNonSelectionElement> | null;
        resizingElement: import("../element/src/types").NonDeletedExcalidrawElement | null;
        multiElement: import("../element/src/types").NonDeleted<import("../element/src/types").ExcalidrawLinearElement> | null;
        selectionElement: import("../element/src/types").NonDeletedExcalidrawElement | null;
        isBindingEnabled: boolean;
        boxSelectionMode: import("./types").BoxSelectionMode;
        bindingPreference: "enabled" | "disabled";
        isMidpointSnappingEnabled: boolean;
        showHints: boolean;
        inputDevice: import("./types").InputDevice;
        suggestedBinding: {
            element: import("../element/src/types").NonDeleted<import("../element/src/types").ExcalidrawBindableElement>;
            midPoint?: import("../math/src/index").GlobalPoint;
        } | null;
        textToolHover: {
            type: "text";
            elementId: ExcalidrawElement["id"];
        } | {
            type: "container";
            elementId: ExcalidrawElement["id"];
        } | {
            type: "arrow";
            elementId: import("../element/src/types").ExcalidrawArrowElement["id"];
            anchor: "start" | "end" | "label";
        } | null;
        frameToHighlight: import("../element/src/types").NonDeleted<import("../element/src/types").ExcalidrawFrameLikeElement> | null;
        frameRendering: {
            enabled: boolean;
            name: boolean;
            outline: boolean;
            clip: boolean;
        };
        editingFrame: import("../element/src/types").ExcalidrawFrameLikeElement["id"] | null;
        elementsToHighlight: readonly import("../element/src/types").NonDeletedExcalidrawElement[] | null;
        editingTextElement: import("../element/src/types").ExcalidrawTextElement | null;
        activeTool: {
            lastActiveTool: import("./types").ActiveTool | null;
            locked: boolean;
            fromSelection: boolean;
        } & import("./types").ActiveTool;
        preferredSelectionTool: {
            type: "selection" | "lasso";
            initialized: boolean;
        };
        penMode: boolean;
        penDetected: boolean;
        exportBackground: boolean;
        exportEmbedScene: boolean;
        exportWithDarkMode: boolean;
        exportScale: number;
        currentItemStrokeColor: string;
        currentItemStickynoteStrokeColor: string;
        currentItemStickynoteBackgroundColor: string;
        currentItemBackgroundColor: string;
        currentItemFillStyle: ExcalidrawElement["fillStyle"];
        currentItemStrokeWidthKey: import("../common/src/index").StrokeWidthKey;
        currentItemStrokeStyle: ExcalidrawElement["strokeStyle"];
        currentItemRoughness: number;
        currentItemStrokeVariability: import("../element/src/types").StrokeVariability;
        currentItemOpacity: number;
        currentItemFontFamily: import("../element/src/types").FontFamilyValues;
        currentItemFontSize: number;
        currentItemTextAlign: import("../element/src/types").TextAlign;
        currentItemStartArrowhead: import("../element/src/types").Arrowhead | null;
        currentItemEndArrowhead: import("../element/src/types").Arrowhead | null;
        currentHoveredFontFamily: import("../element/src/types").FontFamilyValues | null;
        currentItemRoundness: import("../element/src/types").StrokeRoundness;
        currentItemArrowType: "sharp" | "round" | "elbow";
        viewBackgroundColor: string;
        scrollConstraints: ScrollConstraints | null;
        cursorButton: "up" | "down";
        scrolledOutside: boolean;
        name: string | null;
        isResizing: boolean;
        isRotating: boolean;
        openMenu: "canvas" | null;
        openPopup: "canvasBackground" | "elementBackground" | "elementStroke" | "fontFamily" | "compactTextProperties" | "compactStrokeStyles" | "compactOtherProperties" | "compactArrowProperties" | null;
        openSidebar: {
            name: import("./types").SidebarName;
            tab?: import("./types").SidebarTabName;
        } | null;
        openDialog: null | {
            name: "imageExport" | "help" | "jsonExport";
        } | {
            name: "ttd";
            tab: "text-to-diagram" | "mermaid";
        } | {
            name: "commandPalette";
        } | {
            name: "settings";
        } | {
            name: "elementLinkSelector";
            sourceElementId: ExcalidrawElement["id"];
        } | {
            name: "charts";
            data: import("./charts").Spreadsheet;
            rawText: string;
        };
        defaultSidebarDockedPreference: boolean;
        lastPointerDownWith: import("../element/src/types").PointerType;
        selectedElementIds: Readonly<{
            [id: string]: true;
        }>;
        hoveredElementIds: Readonly<{
            [id: string]: true;
        }>;
        previousSelectedElementIds: {
            [id: string]: true;
        };
        selectedElementsAreBeingDragged: boolean;
        shouldCacheIgnoreZoom: boolean;
        toast: {
            message: React.ReactNode;
            closable?: boolean;
            duration?: number;
        } | null;
        zenModeEnabled: boolean;
        theme: import("../element/src/types").Theme;
        gridSize: number;
        gridStep: number;
        gridModeEnabled: boolean;
        viewModeEnabled: boolean;
        selectedGroupIds: {
            [groupId: string]: boolean;
        };
        editingGroupId: import("../element/src/types").GroupId | null;
        width: number;
        height: number;
        offsetTop: number;
        offsetLeft: number;
        fileHandle: FileSystemFileHandle | null;
        collaborators: Map<import("./types").SocketId, import("./types").Collaborator>;
        stats: {
            open: boolean;
            panels: number;
        };
        showHyperlinkPopup: false | "info" | "editor";
        selectedLinearElement: import("../element/src/index").LinearElementEditor | null;
        snapLines: readonly import("./snapping").SnapLine[];
        originSnapOffset: {
            x: number;
            y: number;
        } | null;
        objectsSnapModeEnabled: boolean;
        isCropping: boolean;
        croppingElementId: ExcalidrawElement["id"] | null;
        searchMatches: Readonly<{
            focusedId: ExcalidrawElement["id"] | null;
            matches: readonly import("./types").SearchMatch[];
        }> | null;
        activeLockedId: string | null;
        lockedMultiSelections: {
            [groupId: string]: true;
        };
        bindMode: import("../element/src/types").BindMode;
        colorTopPicks: {
            elementStroke: readonly string[] | null;
            elementBackground: readonly string[] | null;
            bucketFill: readonly string[] | null;
            stickyNoteStroke: readonly string[] | null;
            stickyNoteBackground: readonly string[] | null;
        };
        fontTopPicks: readonly import("../element/src/types").FontFamilyValues[] | null;
    };
    captureUpdate: "EVENTUALLY";
};
export declare const getClosestElementBounds: (elements: readonly ExcalidrawElement[], from: {
    x: number;
    y: number;
}) => Bounds;
export declare const centerScrollOn: ({ scenePoint, viewportDimensions, zoom, offsets, }: {
    scenePoint: PointerCoords;
    viewportDimensions: {
        height: number;
        width: number;
    };
    zoom: Zoom;
    offsets?: Offsets;
}) => {
    scrollX: number;
    scrollY: number;
};
/**
 * The scroll that brings `bounds` into the viewport — less `offsets` (screen
 * px: UI covering its edges, room to leave) — by the least movement, keeping
 * the zoom; `null` when they're in view already. Along an axis where they
 * don't fit, their start (left / top) is brought in instead, or, with
 * `tooLarge: "leave"`, that axis keeps its scroll.
 */
export declare const scrollBoundsIntoView: ({ bounds: [x1, y1, x2, y2], appState: { scrollX, scrollY, zoom, width, height }, offsets, tooLarge, }: {
    bounds: Bounds;
    appState: Pick<AppState, "scrollX" | "scrollY" | "zoom" | "width" | "height">;
    offsets?: Offsets;
    tooLarge?: "alignStart" | "leave";
}) => Pick<AppState, "scrollX" | "scrollY"> | null;
export declare const getScrollToContentState: (elements: readonly ExcalidrawElement[], appState: AppState) => {
    scrollX: number;
    scrollY: number;
};
export {};
