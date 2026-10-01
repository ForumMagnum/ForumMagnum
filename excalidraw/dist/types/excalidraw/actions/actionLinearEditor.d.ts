import type { ExcalidrawLinearElement } from "../../element/src/types";
export declare const actionToggleLinearEditor: {
    name: "toggleLinearEditor";
    category: string;
    label: (elements: readonly import("../../element/src/types").ExcalidrawElement[], appState: Readonly<import("../types").UIAppState>, app: import("../types").AppClassProperties) => "labels.lineEditor.editArrow" | "labels.lineEditor.edit";
    keywords: string[];
    trackEvent: {
        category: "element";
    };
    predicate: (elements: readonly import("../../element/src/types").ExcalidrawElement[], appState: import("../types").AppState, _: import("../types").ExcalidrawProps, app: import("../types").AppClassProperties) => boolean;
    perform(elements: readonly import("../../element/src/types").OrderedExcalidrawElement[], appState: Readonly<import("../types").AppState>, _: unknown, app: import("../types").AppClassProperties): {
        appState: {
            selectedLinearElement: {
                isEditing: boolean;
                elementId: import("../../element/src/types").ExcalidrawElement["id"] & {
                    _brand: "excalidrawLinearElementId";
                };
                selectedPointsIndices: readonly number[] | null;
                initialState: Readonly<{
                    prevSelectedPointsIndices: readonly number[] | null;
                    lastClickedPoint: number;
                    origin: Readonly<import("../../math/src/index").GlobalPoint> | null;
                    segmentMidpoint: {
                        value: import("../../math/src/index").GlobalPoint | null;
                        index: number | null;
                        added: boolean;
                    };
                    arrowStartIsInside: boolean;
                    altFocusPoint: Readonly<import("../../math/src/index").GlobalPoint> | null;
                    arrowOtherEndpointInitialBinding: import("../../element/src/types").FixedPointBinding | null;
                }>;
                isDragging: boolean;
                lastUncommittedPoint: import("../../math/src/index").LocalPoint | null;
                lastCommittedPoint: import("../../math/src/index").LocalPoint | null;
                pointerOffset: Readonly<{
                    x: number;
                    y: number;
                }>;
                hoverPointIndex: number;
                segmentMidPointHoveredCoords: import("../../math/src/index").GlobalPoint | null;
                hoveredFocusPointBinding: "start" | "end" | null;
                draggedFocusPointBinding: "start" | "end" | null;
                elbowed: boolean;
                customLineAngle: number | null;
                pointerDownState: never;
            };
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
            multiElement: import("../../element/src/types").NonDeleted<ExcalidrawLinearElement> | null;
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
                elementId: import("../../element/src/types").ExcalidrawElement["id"];
            } | {
                type: "container";
                elementId: import("../../element/src/types").ExcalidrawElement["id"];
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
            currentItemFillStyle: import("../../element/src/types").ExcalidrawElement["fillStyle"];
            currentItemStrokeWidthKey: import("../../common/src/index").StrokeWidthKey;
            currentItemStrokeStyle: import("../../element/src/types").ExcalidrawElement["strokeStyle"];
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
                sourceElementId: import("../../element/src/types").ExcalidrawElement["id"];
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
            snapLines: readonly import("../snapping").SnapLine[];
            originSnapOffset: {
                x: number;
                y: number;
            } | null;
            objectsSnapModeEnabled: boolean;
            isCropping: boolean;
            croppingElementId: import("../../element/src/types").ExcalidrawElement["id"] | null;
            searchMatches: Readonly<{
                focusedId: import("../../element/src/types").ExcalidrawElement["id"] | null;
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
    PanelComponent: ({ appState, updateData, app }: import("./types").PanelComponentProps) => import("react/jsx-runtime").JSX.Element | null;
} & {
    keyTest?: undefined;
};
export declare const actionTogglePolygon: {
    name: "togglePolygon";
    category: string;
    icon: import("react/jsx-runtime").JSX.Element;
    keywords: string[];
    label: (elements: readonly import("../../element/src/types").ExcalidrawElement[], appState: Readonly<import("../types").UIAppState>, app: import("../types").AppClassProperties) => "labels.polygon.breakPolygon" | "labels.polygon.convertToPolygon";
    trackEvent: {
        category: "element";
    };
    predicate: (elements: readonly import("../../element/src/types").ExcalidrawElement[], appState: import("../types").AppState, _: import("../types").ExcalidrawProps, app: import("../types").AppClassProperties) => boolean;
    perform(elements: readonly import("../../element/src/types").OrderedExcalidrawElement[], appState: Readonly<import("../types").AppState>, _: unknown, app: import("../types").AppClassProperties): false | {
        elements: ((Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & Readonly<{
            type: "line" | "arrow";
            points: readonly import("../../math/src/index").LocalPoint[];
            startBinding: import("../../element/src/types").FixedPointBinding | null;
            endBinding: import("../../element/src/types").FixedPointBinding | null;
            startArrowhead: import("../../element/src/types").Arrowhead | null;
            endArrowhead: import("../../element/src/types").Arrowhead | null;
        }> & {
            index: import("../../element/src/types").FractionalIndex;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & {
            type: "selection";
        } & {
            index: import("../../element/src/types").FractionalIndex;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & {
            type: "rectangle";
        } & {
            index: import("../../element/src/types").FractionalIndex;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & Readonly<{
            type: "stickynote";
            baseHeight: number;
        }> & {
            index: import("../../element/src/types").FractionalIndex;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & {
            type: "diamond";
        } & {
            index: import("../../element/src/types").FractionalIndex;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & {
            type: "ellipse";
        } & {
            index: import("../../element/src/types").FractionalIndex;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & Readonly<{
            type: "embeddable";
        }> & {
            index: import("../../element/src/types").FractionalIndex;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & Readonly<{
            type: "iframe";
            customData?: {
                generationData?: import("../../element/src/types").MagicGenerationData;
            };
        }> & {
            index: import("../../element/src/types").FractionalIndex;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & Readonly<{
            type: "image";
            fileId: import("../../element/src/types").FileId | null;
            status: "pending" | "saved" | "error";
            scale: [number, number];
            crop: import("../../element/src/types").ImageCrop | null;
        }> & {
            index: import("../../element/src/types").FractionalIndex;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & {
            type: "frame";
            name: string | null;
        } & {
            index: import("../../element/src/types").FractionalIndex;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & {
            type: "magicframe";
            name: string | null;
        } & {
            index: import("../../element/src/types").FractionalIndex;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & Readonly<{
            type: "text";
            fontSize: number;
            fontFamily: import("../../element/src/types").FontFamilyValues;
            baseFontSize: number | null;
            text: string;
            textAlign: import("../../element/src/types").TextAlign;
            verticalAlign: import("../../element/src/types").VerticalAlign;
            containerId: import("../../element/src/types").ExcalidrawTextContainer["id"] | null;
            originalText: string;
            autoResize: boolean;
            lineHeight: number & {
                _brand: "unitlessLineHeight";
            };
            labelPosition?: number | null;
        }> & {
            index: import("../../element/src/types").FractionalIndex;
        }) | (Readonly<{
            id: string;
            x: number;
            y: number;
            strokeColor: string;
            backgroundColor: string;
            fillStyle: import("../../element/src/types").FillStyle;
            strokeWidth: number;
            strokeStyle: import("../../element/src/types").StrokeStyle;
            roundness: null | {
                type: import("../../element/src/types").RoundnessType;
                value?: number;
            };
            roughness: number;
            opacity: number;
            width: number;
            height: number;
            angle: import("../../math/src/index").Radians;
            seed: number;
            version: number;
            versionNonce: number;
            index: import("../../element/src/types").FractionalIndex | null;
            isDeleted: boolean;
            groupIds: readonly import("../../element/src/types").GroupId[];
            frameId: string | null;
            boundElements: readonly import("../../element/src/types").BoundElement[] | null;
            updated: number;
            created: number | null;
            link: string | null;
            locked: boolean;
            customData?: Record<string, any>;
        }> & Readonly<{
            type: "freedraw";
            points: readonly import("../../math/src/index").LocalPoint[];
            pressures: readonly number[];
            simulatePressure: boolean;
            strokeOptions: import("../../element/src/types").StrokeOptions;
        }> & {
            index: import("../../element/src/types").FractionalIndex;
        }))[];
        appState: Readonly<import("../types").AppState>;
        captureUpdate: "IMMEDIATELY";
    };
    PanelComponent: ({ appState, updateData, app }: import("./types").PanelComponentProps) => import("react/jsx-runtime").JSX.Element | null;
} & {
    keyTest?: undefined;
};
