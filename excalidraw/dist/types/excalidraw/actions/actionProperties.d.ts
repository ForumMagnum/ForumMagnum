import { type StrokeWidthKey } from "../../common/src/index";
import { LinearElementEditor } from "../../element/src/index";
import type { Arrowhead, ExcalidrawBindableElement, ExcalidrawElement, ExcalidrawFreeDrawElement, ExcalidrawLinearElement, ExcalidrawTextElement, FontFamilyValues, StrokeVariability, NonDeleted, NonDeletedExcalidrawElement, TextAlign } from "../../element/src/types";
import type { AppClassProperties, AppState, Primitive } from "../types";
export declare const changeProperty: (elements: readonly ExcalidrawElement[], appState: AppState, callback: (element: NonDeletedExcalidrawElement) => ExcalidrawElement, includeBoundText?: boolean) => (ExcalidrawLinearElement | import("../../element/src/types").ExcalidrawSelectionElement | import("../../element/src/types").ExcalidrawRectangleElement | import("../../element/src/types").ExcalidrawStickyNoteElement | import("../../element/src/types").ExcalidrawDiamondElement | import("../../element/src/types").ExcalidrawEllipseElement | import("../../element/src/types").ExcalidrawEmbeddableElement | import("../../element/src/types").ExcalidrawIframeElement | import("../../element/src/types").ExcalidrawImageElement | import("../../element/src/types").ExcalidrawFrameElement | import("../../element/src/types").ExcalidrawMagicFrameElement | ExcalidrawTextElement | ExcalidrawFreeDrawElement)[];
export declare const getFormValue: <T extends Primitive>(elements: readonly ExcalidrawElement[], app: AppClassProperties, 
/**
 * input value (usually the element attribute value,
 * but depends on what the action's PanelComponent input expects)
 */
getValue: (element: ExcalidrawElement) => T, elementPredicate: true | ((element: ExcalidrawElement) => boolean), defaultValue: T | ((isSomeElementSelected: boolean) => T)) => T;
export declare const actionChangeStrokeColor: import("./types").Action<Partial<AppState> & {
    color?: string;
}> & {
    keyTest?: ((event: React.KeyboardEvent | KeyboardEvent, appState: AppState, elements: readonly ExcalidrawElement[], app: AppClassProperties) => boolean) | undefined;
};
export declare const actionChangeBackgroundColor: import("./types").Action<Partial<AppState> & {
    color?: string;
}> & {
    keyTest?: ((event: React.KeyboardEvent | KeyboardEvent, appState: AppState, elements: readonly ExcalidrawElement[], app: AppClassProperties) => boolean) | undefined;
};
export declare const actionChangeBucketFillBackgroundColor: import("./types").Action<Pick<AppState, "currentItemBackgroundColor">> & {
    keyTest?: ((event: React.KeyboardEvent | KeyboardEvent, appState: AppState, elements: readonly ExcalidrawElement[], app: AppClassProperties) => boolean) | undefined;
};
export declare const actionChangeFillStyle: import("./types").Action<import("../../element/src/types").FillStyle> & {
    keyTest?: ((event: React.KeyboardEvent | KeyboardEvent, appState: AppState, elements: readonly ExcalidrawElement[], app: AppClassProperties) => boolean) | undefined;
};
export declare const actionChangeStrokeWidth: import("./types").Action<StrokeWidthKey> & {
    keyTest?: ((event: React.KeyboardEvent | KeyboardEvent, appState: AppState, elements: readonly ExcalidrawElement[], app: AppClassProperties) => boolean) | undefined;
};
export declare const actionChangeSloppiness: import("./types").Action<number> & {
    keyTest?: ((event: React.KeyboardEvent | KeyboardEvent, appState: AppState, elements: readonly ExcalidrawElement[], app: AppClassProperties) => boolean) | undefined;
};
export declare const actionChangeFreedrawMode: import("./types").Action<StrokeVariability> & {
    keyTest?: ((event: React.KeyboardEvent | KeyboardEvent, appState: AppState, elements: readonly ExcalidrawElement[], app: AppClassProperties) => boolean) | undefined;
};
export declare const actionChangeStrokeStyle: import("./types").Action<import("../../element/src/types").StrokeStyle> & {
    keyTest?: ((event: React.KeyboardEvent | KeyboardEvent, appState: AppState, elements: readonly ExcalidrawElement[], app: AppClassProperties) => boolean) | undefined;
};
export declare const actionChangeOpacity: import("./types").Action<number> & {
    keyTest?: ((event: React.KeyboardEvent | KeyboardEvent, appState: AppState, elements: readonly ExcalidrawElement[], app: AppClassProperties) => boolean) | undefined;
};
export declare const actionChangeFontSize: import("./types").Action<number> & {
    keyTest?: ((event: React.KeyboardEvent | KeyboardEvent, appState: AppState, elements: readonly ExcalidrawElement[], app: AppClassProperties) => boolean) | undefined;
};
export declare const actionDecreaseFontSize: {
    name: "decreaseFontSize";
    label: string;
    icon: import("react/jsx-runtime").JSX.Element;
    trackEvent: false;
    perform: (elements: readonly import("../../element/src/types").OrderedExcalidrawElement[], appState: Readonly<AppState>, value: unknown, app: AppClassProperties) => {
        elements: (ExcalidrawLinearElement | import("../../element/src/types").ExcalidrawSelectionElement | import("../../element/src/types").ExcalidrawRectangleElement | import("../../element/src/types").ExcalidrawStickyNoteElement | import("../../element/src/types").ExcalidrawDiamondElement | import("../../element/src/types").ExcalidrawEllipseElement | import("../../element/src/types").ExcalidrawEmbeddableElement | import("../../element/src/types").ExcalidrawIframeElement | import("../../element/src/types").ExcalidrawImageElement | import("../../element/src/types").ExcalidrawFrameElement | import("../../element/src/types").ExcalidrawMagicFrameElement | ExcalidrawTextElement | ExcalidrawFreeDrawElement)[];
        appState: {
            currentItemFontSize: number;
            contextMenu: {
                items: import("../components/ContextMenu").ContextMenuItems;
                top: number;
                left: number;
            } | null;
            showWelcomeScreen: boolean;
            isLoading: boolean;
            errorMessage: React.ReactNode;
            activeEmbeddable: {
                element: NonDeletedExcalidrawElement;
                state: "hover" | "active";
            } | null;
            newElement: NonDeleted<import("../../element/src/types").ExcalidrawNonSelectionElement> | null;
            resizingElement: NonDeletedExcalidrawElement | null;
            multiElement: NonDeleted<ExcalidrawLinearElement> | null;
            selectionElement: NonDeletedExcalidrawElement | null;
            isBindingEnabled: boolean;
            boxSelectionMode: import("../types").BoxSelectionMode;
            bindingPreference: "enabled" | "disabled";
            isMidpointSnappingEnabled: boolean;
            showHints: boolean;
            inputDevice: import("../types").InputDevice;
            suggestedBinding: {
                element: NonDeleted<ExcalidrawBindableElement>;
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
            elementsToHighlight: readonly NonDeletedExcalidrawElement[] | null;
            editingTextElement: ExcalidrawTextElement | null;
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
            currentItemStrokeWidthKey: StrokeWidthKey;
            currentItemStrokeStyle: ExcalidrawElement["strokeStyle"];
            currentItemRoughness: number;
            currentItemStrokeVariability: StrokeVariability;
            currentItemOpacity: number;
            currentItemFontFamily: FontFamilyValues;
            currentItemTextAlign: TextAlign;
            currentItemStartArrowhead: Arrowhead | null;
            currentItemEndArrowhead: Arrowhead | null;
            currentHoveredFontFamily: FontFamilyValues | null;
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
            theme: import("../../element/src/types").Theme;
            gridSize: number;
            gridStep: number;
            gridModeEnabled: boolean;
            viewModeEnabled: boolean;
            selectedGroupIds: {
                [groupId: string]: boolean;
            };
            editingGroupId: import("../../element/src/types").GroupId | null;
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
            selectedLinearElement: LinearElementEditor | null;
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
            fontTopPicks: readonly FontFamilyValues[] | null;
        };
        captureUpdate: "IMMEDIATELY";
    };
    keyTest: (event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean;
} & {
    keyTest?: ((event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean) | undefined;
};
export declare const actionIncreaseFontSize: {
    name: "increaseFontSize";
    label: string;
    icon: import("react/jsx-runtime").JSX.Element;
    trackEvent: false;
    perform: (elements: readonly import("../../element/src/types").OrderedExcalidrawElement[], appState: Readonly<AppState>, value: unknown, app: AppClassProperties) => {
        elements: (ExcalidrawLinearElement | import("../../element/src/types").ExcalidrawSelectionElement | import("../../element/src/types").ExcalidrawRectangleElement | import("../../element/src/types").ExcalidrawStickyNoteElement | import("../../element/src/types").ExcalidrawDiamondElement | import("../../element/src/types").ExcalidrawEllipseElement | import("../../element/src/types").ExcalidrawEmbeddableElement | import("../../element/src/types").ExcalidrawIframeElement | import("../../element/src/types").ExcalidrawImageElement | import("../../element/src/types").ExcalidrawFrameElement | import("../../element/src/types").ExcalidrawMagicFrameElement | ExcalidrawTextElement | ExcalidrawFreeDrawElement)[];
        appState: {
            currentItemFontSize: number;
            contextMenu: {
                items: import("../components/ContextMenu").ContextMenuItems;
                top: number;
                left: number;
            } | null;
            showWelcomeScreen: boolean;
            isLoading: boolean;
            errorMessage: React.ReactNode;
            activeEmbeddable: {
                element: NonDeletedExcalidrawElement;
                state: "hover" | "active";
            } | null;
            newElement: NonDeleted<import("../../element/src/types").ExcalidrawNonSelectionElement> | null;
            resizingElement: NonDeletedExcalidrawElement | null;
            multiElement: NonDeleted<ExcalidrawLinearElement> | null;
            selectionElement: NonDeletedExcalidrawElement | null;
            isBindingEnabled: boolean;
            boxSelectionMode: import("../types").BoxSelectionMode;
            bindingPreference: "enabled" | "disabled";
            isMidpointSnappingEnabled: boolean;
            showHints: boolean;
            inputDevice: import("../types").InputDevice;
            suggestedBinding: {
                element: NonDeleted<ExcalidrawBindableElement>;
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
            elementsToHighlight: readonly NonDeletedExcalidrawElement[] | null;
            editingTextElement: ExcalidrawTextElement | null;
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
            currentItemStrokeWidthKey: StrokeWidthKey;
            currentItemStrokeStyle: ExcalidrawElement["strokeStyle"];
            currentItemRoughness: number;
            currentItemStrokeVariability: StrokeVariability;
            currentItemOpacity: number;
            currentItemFontFamily: FontFamilyValues;
            currentItemTextAlign: TextAlign;
            currentItemStartArrowhead: Arrowhead | null;
            currentItemEndArrowhead: Arrowhead | null;
            currentHoveredFontFamily: FontFamilyValues | null;
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
            theme: import("../../element/src/types").Theme;
            gridSize: number;
            gridStep: number;
            gridModeEnabled: boolean;
            viewModeEnabled: boolean;
            selectedGroupIds: {
                [groupId: string]: boolean;
            };
            editingGroupId: import("../../element/src/types").GroupId | null;
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
            selectedLinearElement: LinearElementEditor | null;
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
            fontTopPicks: readonly FontFamilyValues[] | null;
        };
        captureUpdate: "IMMEDIATELY";
    };
    keyTest: (event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean;
} & {
    keyTest?: ((event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean) | undefined;
};
export declare const actionChangeFontFamily: import("./types").Action<{
    currentItemFontFamily: any;
    currentHoveredFontFamily: any;
}> & {
    keyTest?: ((event: React.KeyboardEvent | KeyboardEvent, appState: AppState, elements: readonly ExcalidrawElement[], app: AppClassProperties) => boolean) | undefined;
};
export declare const actionChangeTextAlign: import("./types").Action<string> & {
    keyTest?: ((event: React.KeyboardEvent | KeyboardEvent, appState: AppState, elements: readonly ExcalidrawElement[], app: AppClassProperties) => boolean) | undefined;
};
export declare const actionChangeVerticalAlign: import("./types").Action<string> & {
    keyTest?: ((event: React.KeyboardEvent | KeyboardEvent, appState: AppState, elements: readonly ExcalidrawElement[], app: AppClassProperties) => boolean) | undefined;
};
export declare const actionChangeRoundness: import("./types").Action<"round" | "sharp"> & {
    keyTest?: ((event: React.KeyboardEvent | KeyboardEvent, appState: AppState, elements: readonly ExcalidrawElement[], app: AppClassProperties) => boolean) | undefined;
};
export declare const actionChangeArrowhead: import("./types").Action<{
    position: "start" | "end";
    type: Arrowhead;
}> & {
    keyTest?: ((event: React.KeyboardEvent | KeyboardEvent, appState: AppState, elements: readonly ExcalidrawElement[], app: AppClassProperties) => boolean) | undefined;
};
export declare const actionChangeArrowProperties: {
    name: "changeArrowProperties";
    label: string;
    trackEvent: false;
    perform: (elements: readonly import("../../element/src/types").OrderedExcalidrawElement[], appState: Readonly<AppState>, value: unknown, app: AppClassProperties) => false;
    PanelComponent: ({ elements, appState, updateData, app, renderAction }: import("./types").PanelComponentProps) => import("react/jsx-runtime").JSX.Element;
} & {
    keyTest?: undefined;
};
export declare const actionChangeArrowType: import("./types").Action<"round" | "sharp" | "elbow"> & {
    keyTest?: ((event: React.KeyboardEvent | KeyboardEvent, appState: AppState, elements: readonly ExcalidrawElement[], app: AppClassProperties) => boolean) | undefined;
};
