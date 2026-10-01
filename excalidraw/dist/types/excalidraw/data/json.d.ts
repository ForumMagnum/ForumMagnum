import type { ExcalidrawElement } from "../../element/src/types";
import type { MaybePromise } from "../../common/src/utility-types";
import type { AppState, BinaryFiles, LibraryItems } from "../types";
import type { ImportedDataState, ImportedLibraryData } from "./types";
export type JSONExportData = {
    elements: readonly ExcalidrawElement[];
    appState: AppState;
    files: BinaryFiles;
};
export declare const serializeAsJSON: (elements: readonly ExcalidrawElement[], appState: Partial<AppState>, files: BinaryFiles, type: "local" | "database") => string;
export declare const saveAsJSON: ({ data, filename, fileHandle, }: {
    data: MaybePromise<JSONExportData>;
    filename: string;
    fileHandle: AppState["fileHandle"];
}) => Promise<{
    fileHandle: FileSystemFileHandle | null;
}>;
export declare const loadFromJSON: (localAppState: AppState, localElements: readonly ExcalidrawElement[] | null) => Promise<{
    elements: import("../../element/src/types").OrderedExcalidrawElement[];
    appState: {
        name: string | null;
        zoom: import("../types").Zoom;
        viewModeEnabled: boolean;
        activeTool: {
            lastActiveTool: import("../types").ActiveTool | null;
            locked: boolean;
            fromSelection: boolean;
        } & import("../types").ActiveTool;
        zenModeEnabled: boolean;
        gridModeEnabled: boolean;
        objectsSnapModeEnabled: boolean;
        theme: import("../../element/src/types").Theme;
        currentItemArrowType: "sharp" | "round" | "elbow";
        gridSize: number;
        contextMenu: {
            items: import("../components/ContextMenu").ContextMenuItems;
            top: number;
            left: number;
        } | null;
        showWelcomeScreen: boolean;
        isLoading: boolean;
        errorMessage: React.ReactNode;
        activeEmbeddable: {
            element: import("../../element/src/types").NonDeletedExcalidrawElement;
            state: "hover" | "active";
        } | null;
        newElement: import("../../element/src/types").NonDeleted<import("../../element/src/types").ExcalidrawNonSelectionElement> | null;
        resizingElement: import("../../element/src/types").NonDeletedExcalidrawElement | null;
        multiElement: import("../../element/src/types").NonDeleted<import("../../element/src/types").ExcalidrawLinearElement> | null;
        selectionElement: import("../../element/src/types").NonDeletedExcalidrawElement | null;
        isBindingEnabled: boolean;
        boxSelectionMode: import("../types").BoxSelectionMode;
        bindingPreference: "enabled" | "disabled";
        isMidpointSnappingEnabled: boolean;
        showHints: boolean;
        inputDevice: import("../types").InputDevice;
        suggestedBinding: {
            element: import("../../element/src/types").NonDeleted<import("../../element/src/types").ExcalidrawBindableElement>;
            midPoint?: import("../../math/src/index").GlobalPoint;
        } | null;
        textToolHover: {
            type: "text";
            elementId: ExcalidrawElement["id"];
        } | {
            type: "container";
            elementId: ExcalidrawElement["id"];
        } | {
            type: "arrow";
            elementId: import("../../element/src/types").ExcalidrawArrowElement["id"];
            anchor: "start" | "end" | "label";
        } | null;
        frameToHighlight: import("../../element/src/types").NonDeleted<import("../../element/src/types").ExcalidrawFrameLikeElement> | null;
        frameRendering: {
            enabled: boolean;
            name: boolean;
            outline: boolean;
            clip: boolean;
        };
        editingFrame: import("../../element/src/types").ExcalidrawFrameLikeElement["id"] | null;
        elementsToHighlight: readonly import("../../element/src/types").NonDeletedExcalidrawElement[] | null;
        editingTextElement: import("../../element/src/types").ExcalidrawTextElement | null;
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
        currentItemStrokeWidthKey: import("../../common/src/index").StrokeWidthKey;
        currentItemStrokeStyle: ExcalidrawElement["strokeStyle"];
        currentItemRoughness: number;
        currentItemStrokeVariability: import("../../element/src/types").StrokeVariability;
        currentItemOpacity: number;
        currentItemFontFamily: import("../../element/src/types").FontFamilyValues;
        currentItemFontSize: number;
        currentItemTextAlign: import("../../element/src/types").TextAlign;
        currentItemStartArrowhead: import("../../element/src/types").Arrowhead | null;
        currentItemEndArrowhead: import("../../element/src/types").Arrowhead | null;
        currentHoveredFontFamily: import("../../element/src/types").FontFamilyValues | null;
        currentItemRoundness: import("../../element/src/types").StrokeRoundness;
        viewBackgroundColor: string;
        scrollX: number;
        scrollY: number;
        scrollConstraints: import("../types").ScrollConstraints | null;
        cursorButton: "up" | "down";
        scrolledOutside: boolean;
        isResizing: boolean;
        isRotating: boolean;
        openMenu: "canvas" | null;
        openPopup: "canvasBackground" | "elementBackground" | "elementStroke" | "fontFamily" | "compactTextProperties" | "compactStrokeStyles" | "compactOtherProperties" | "compactArrowProperties" | null;
        openSidebar: {
            name: import("../types").SidebarName;
            tab?: import("../types").SidebarTabName;
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
            data: import("../charts").Spreadsheet;
            rawText: string;
        };
        defaultSidebarDockedPreference: boolean;
        lastPointerDownWith: import("../../element/src/types").PointerType;
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
        gridStep: number;
        selectedGroupIds: {
            [groupId: string]: boolean;
        };
        editingGroupId: import("../../element/src/types").GroupId | null;
        fileHandle: FileSystemFileHandle | null;
        collaborators: Map<import("../types").SocketId, import("../types").Collaborator>;
        stats: {
            open: boolean;
            panels: number;
        };
        showHyperlinkPopup: false | "info" | "editor";
        selectedLinearElement: import("../../element/src/index").LinearElementEditor | null;
        snapLines: readonly import("../snapping").SnapLine[];
        originSnapOffset: {
            x: number;
            y: number;
        } | null;
        isCropping: boolean;
        croppingElementId: ExcalidrawElement["id"] | null;
        searchMatches: Readonly<{
            focusedId: ExcalidrawElement["id"] | null;
            matches: readonly import("../types").SearchMatch[];
        }> | null;
        activeLockedId: string | null;
        lockedMultiSelections: {
            [groupId: string]: true;
        };
        bindMode: import("../../element/src/types").BindMode;
        colorTopPicks: {
            elementStroke: readonly string[] | null;
            elementBackground: readonly string[] | null;
            bucketFill: readonly string[] | null;
            stickyNoteStroke: readonly string[] | null;
            stickyNoteBackground: readonly string[] | null;
        };
        fontTopPicks: readonly import("../../element/src/types").FontFamilyValues[] | null;
    };
    files: BinaryFiles;
}>;
export declare const isValidExcalidrawData: (data?: {
    type?: any;
    elements?: any;
    appState?: any;
}) => data is ImportedDataState;
export declare const isValidLibrary: (json: any) => json is ImportedLibraryData;
export declare const serializeLibraryAsJSON: (libraryItems: LibraryItems) => string;
export declare const saveLibraryAsJSON: (libraryItems: LibraryItems) => Promise<void>;
