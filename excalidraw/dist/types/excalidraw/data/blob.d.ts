import { IMAGE_MIME_TYPES, MIME_TYPES } from "../../common/src/index";
import type { ValueOf } from "../../common/src/utility-types";
import type { ExcalidrawElement, FileId } from "../../element/src/types";
import type { AppState, DataURL, LibraryItem } from "../types";
import type { ImportedLibraryData } from "./types";
export declare const getMimeType: (blob: Blob | string) => string;
export declare const getFileHandleType: (handle: FileSystemFileHandle | null) => string | null;
export declare const isImageFileHandleType: (type: string | null) => type is "png" | "svg";
export declare const isImageFileHandle: (handle: FileSystemFileHandle | null) => handle is FileSystemFileHandle;
export declare const isSupportedImageFileType: (type: string | null | undefined) => boolean;
export declare const isSupportedImageFile: (blob: Blob | null | undefined) => blob is Blob & {
    type: ValueOf<typeof IMAGE_MIME_TYPES>;
};
export declare const loadSceneOrLibraryFromBlob: (blob: Blob | File, 
/** @see restore.localAppState */
localAppState: AppState | null, localElements: readonly ExcalidrawElement[] | null, 
/** FileSystemFileHandle. Defaults to `blob.handle` if defined, otherwise null. */
fileHandle?: FileSystemFileHandle | null) => Promise<{
    type: "application/vnd.excalidraw+json";
    data: {
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
        files: import("../types").BinaryFiles;
    };
} | {
    type: "application/vnd.excalidrawlib+json";
    data: ImportedLibraryData;
}>;
export declare const loadFromBlob: (blob: Blob, 
/** @see restore.localAppState */
localAppState: AppState | null, localElements: readonly ExcalidrawElement[] | null, 
/** FileSystemFileHandle. Defaults to `blob.handle` if defined, otherwise null. */
fileHandle?: FileSystemFileHandle | null) => Promise<{
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
    files: import("../types").BinaryFiles;
}>;
export declare const parseLibraryJSON: (json: string, defaultStatus?: LibraryItem["status"]) => LibraryItem[];
export declare const loadLibraryFromBlob: (blob: Blob, defaultStatus?: LibraryItem["status"]) => Promise<LibraryItem[]>;
export declare const canvasToBlob: (canvas: HTMLCanvasElement | Promise<HTMLCanvasElement>) => Promise<Blob>;
/** generates SHA-1 digest from supplied file (if not supported, falls back
    to a 40-char base64 random id) */
export declare const generateIdFromFile: (file: File) => Promise<FileId>;
/** async. For sync variant, use getDataURL_sync */
export declare const getDataURL: (file: Blob | File) => Promise<DataURL>;
export declare const getDataURL_sync: (data: string | Uint8Array | ArrayBuffer, mimeType: ValueOf<typeof MIME_TYPES>) => DataURL;
export declare const dataURLToFile: (dataURL: DataURL, filename?: string) => File;
export declare const dataURLToString: (dataURL: DataURL) => string;
export declare const resizeImageFile: (file: File, opts: {
    /** undefined indicates auto */
    outputType?: (typeof MIME_TYPES)["jpg"];
    maxWidthOrHeight: number;
}) => Promise<File>;
export declare const SVGStringToFile: (SVGString: string, filename?: string) => File & {
    type: typeof MIME_TYPES.svg;
};
export declare const ImageURLToFile: (imageUrl: string, filename?: string) => Promise<File | undefined>;
export declare const getFileHandle: (event: DragEvent | React.DragEvent | DataTransferItem) => Promise<FileSystemFileHandle | null>;
export declare const createFile: (blob: File | Blob | ArrayBuffer, mimeType: string, name: string | undefined) => File;
/** attempts to detect correct mimeType if none is set, or if an image
 * has an incorrect extension.
 * Note: doesn't handle missing .excalidraw/.excalidrawlib extension  */
export declare const normalizeFile: (file: File) => Promise<File>;
export declare const blobToArrayBuffer: (blob: Blob) => Promise<ArrayBuffer>;
