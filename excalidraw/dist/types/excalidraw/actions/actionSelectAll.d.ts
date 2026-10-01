import { LinearElementEditor } from "../../element/src/index";
import type { ExcalidrawElement, ExcalidrawLinearElement, NonDeleted } from "../../element/src/types";
export declare const actionSelectAll: {
    name: "selectAll";
    label: string;
    icon: import("react/jsx-runtime").JSX.Element;
    trackEvent: {
        category: "canvas";
    };
    viewMode: false;
    perform: (elements: readonly import("../../element/src/types").OrderedExcalidrawElement[], appState: Readonly<import("../types").AppState>, value: unknown, app: import("../types").AppClassProperties) => false | {
        appState: {
            selectedLinearElement: LinearElementEditor | null;
            selectedElementIds: import("../types").AppState["selectedElementIds"];
            selectedGroupIds: import("../types").AppState["selectedGroupIds"];
            editingGroupId: import("../types").AppState["editingGroupId"];
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
            newElement: NonDeleted<import("../../element/src/types").ExcalidrawNonSelectionElement> | null;
            resizingElement: import("../../element/src/types").NonDeletedExcalidrawElement | null;
            multiElement: NonDeleted<ExcalidrawLinearElement> | null;
            selectionElement: import("../../element/src/types").NonDeletedExcalidrawElement | null;
            isBindingEnabled: boolean;
            boxSelectionMode: import("../types").BoxSelectionMode;
            bindingPreference: "enabled" | "disabled";
            isMidpointSnappingEnabled: boolean;
            showHints: boolean;
            inputDevice: import("../types").InputDevice;
            suggestedBinding: {
                element: NonDeleted<import("../../element/src/types").ExcalidrawBindableElement>;
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
            frameToHighlight: NonDeleted<import("../../element/src/types").ExcalidrawFrameLikeElement> | null;
            frameRendering: {
                enabled: boolean;
                name: boolean;
                outline: boolean;
                clip: boolean;
            };
            editingFrame: import("../../element/src/types").ExcalidrawFrameLikeElement["id"] | null;
            elementsToHighlight: readonly import("../../element/src/types").NonDeletedExcalidrawElement[] | null;
            editingTextElement: import("../../element/src/types").ExcalidrawTextElement | null;
            activeTool: {
                lastActiveTool: import("../types").ActiveTool | null;
                locked: boolean;
                fromSelection: boolean;
            } & import("../types").ActiveTool;
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
            currentItemArrowType: "sharp" | "round" | "elbow";
            viewBackgroundColor: string;
            scrollX: number;
            scrollY: number;
            scrollConstraints: import("../types").ScrollConstraints | null;
            cursorButton: "up" | "down";
            scrolledOutside: boolean;
            name: string | null;
            isResizing: boolean;
            isRotating: boolean;
            zoom: import("../types").Zoom;
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
            theme: import("../../element/src/types").Theme;
            gridSize: number;
            gridStep: number;
            gridModeEnabled: boolean;
            viewModeEnabled: boolean;
            width: number;
            height: number;
            offsetTop: number;
            offsetLeft: number;
            fileHandle: FileSystemFileHandle | null;
            collaborators: Map<import("../types").SocketId, import("../types").Collaborator>;
            stats: {
                open: boolean;
                panels: number;
            };
            showHyperlinkPopup: false | "info" | "editor";
            snapLines: readonly import("../snapping").SnapLine[];
            originSnapOffset: {
                x: number;
                y: number;
            } | null;
            objectsSnapModeEnabled: boolean;
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
        captureUpdate: "IMMEDIATELY";
    };
    keyTest: (event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean;
} & {
    keyTest?: ((event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean) | undefined;
};
