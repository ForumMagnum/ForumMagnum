import type { ExcalidrawElement } from "../../element/src/types";
import type { AppClassProperties, AppState, UIAppState } from "../types";
export declare const alignActionsPredicate: (appState: UIAppState, app: AppClassProperties) => boolean;
export declare const actionAlignTop: {
    name: "alignTop";
    label: string;
    icon: import("react/jsx-runtime").JSX.Element;
    trackEvent: {
        category: "element";
    };
    predicate: (elements: readonly ExcalidrawElement[], appState: AppState, appProps: import("../types").ExcalidrawProps, app: AppClassProperties) => boolean;
    perform: (elements: readonly import("../../element/src/types").OrderedExcalidrawElement[], appState: Readonly<AppState>, _: unknown, app: AppClassProperties) => {
        appState: Readonly<AppState>;
        elements: (import("../../element/src/types").ExcalidrawLinearElement | import("../../element/src/types").ExcalidrawSelectionElement | import("../../element/src/types").ExcalidrawRectangleElement | import("../../element/src/types").ExcalidrawStickyNoteElement | import("../../element/src/types").ExcalidrawDiamondElement | import("../../element/src/types").ExcalidrawEllipseElement | import("../../element/src/types").ExcalidrawEmbeddableElement | import("../../element/src/types").ExcalidrawIframeElement | import("../../element/src/types").ExcalidrawImageElement | import("../../element/src/types").ExcalidrawFrameElement | import("../../element/src/types").ExcalidrawMagicFrameElement | import("../../element/src/types").ExcalidrawTextElement | import("../../element/src/types").ExcalidrawFreeDrawElement)[];
        captureUpdate: "IMMEDIATELY";
    };
    keyTest: (event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean;
    PanelComponent: ({ elements, appState, updateData, app }: import("./types").PanelComponentProps) => import("react/jsx-runtime").JSX.Element;
} & {
    keyTest?: ((event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean) | undefined;
};
export declare const actionAlignBottom: {
    name: "alignBottom";
    label: string;
    icon: import("react/jsx-runtime").JSX.Element;
    trackEvent: {
        category: "element";
    };
    predicate: (elements: readonly ExcalidrawElement[], appState: AppState, appProps: import("../types").ExcalidrawProps, app: AppClassProperties) => boolean;
    perform: (elements: readonly import("../../element/src/types").OrderedExcalidrawElement[], appState: Readonly<AppState>, _: unknown, app: AppClassProperties) => {
        appState: Readonly<AppState>;
        elements: (import("../../element/src/types").ExcalidrawLinearElement | import("../../element/src/types").ExcalidrawSelectionElement | import("../../element/src/types").ExcalidrawRectangleElement | import("../../element/src/types").ExcalidrawStickyNoteElement | import("../../element/src/types").ExcalidrawDiamondElement | import("../../element/src/types").ExcalidrawEllipseElement | import("../../element/src/types").ExcalidrawEmbeddableElement | import("../../element/src/types").ExcalidrawIframeElement | import("../../element/src/types").ExcalidrawImageElement | import("../../element/src/types").ExcalidrawFrameElement | import("../../element/src/types").ExcalidrawMagicFrameElement | import("../../element/src/types").ExcalidrawTextElement | import("../../element/src/types").ExcalidrawFreeDrawElement)[];
        captureUpdate: "IMMEDIATELY";
    };
    keyTest: (event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean;
    PanelComponent: ({ elements, appState, updateData, app }: import("./types").PanelComponentProps) => import("react/jsx-runtime").JSX.Element;
} & {
    keyTest?: ((event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean) | undefined;
};
export declare const actionAlignLeft: {
    name: "alignLeft";
    label: string;
    icon: import("react/jsx-runtime").JSX.Element;
    trackEvent: {
        category: "element";
    };
    predicate: (elements: readonly ExcalidrawElement[], appState: AppState, appProps: import("../types").ExcalidrawProps, app: AppClassProperties) => boolean;
    perform: (elements: readonly import("../../element/src/types").OrderedExcalidrawElement[], appState: Readonly<AppState>, _: unknown, app: AppClassProperties) => {
        appState: Readonly<AppState>;
        elements: (import("../../element/src/types").ExcalidrawLinearElement | import("../../element/src/types").ExcalidrawSelectionElement | import("../../element/src/types").ExcalidrawRectangleElement | import("../../element/src/types").ExcalidrawStickyNoteElement | import("../../element/src/types").ExcalidrawDiamondElement | import("../../element/src/types").ExcalidrawEllipseElement | import("../../element/src/types").ExcalidrawEmbeddableElement | import("../../element/src/types").ExcalidrawIframeElement | import("../../element/src/types").ExcalidrawImageElement | import("../../element/src/types").ExcalidrawFrameElement | import("../../element/src/types").ExcalidrawMagicFrameElement | import("../../element/src/types").ExcalidrawTextElement | import("../../element/src/types").ExcalidrawFreeDrawElement)[];
        captureUpdate: "IMMEDIATELY";
    };
    keyTest: (event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean;
    PanelComponent: ({ elements, appState, updateData, app }: import("./types").PanelComponentProps) => import("react/jsx-runtime").JSX.Element;
} & {
    keyTest?: ((event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean) | undefined;
};
export declare const actionAlignRight: {
    name: "alignRight";
    label: string;
    icon: import("react/jsx-runtime").JSX.Element;
    trackEvent: {
        category: "element";
    };
    predicate: (elements: readonly ExcalidrawElement[], appState: AppState, appProps: import("../types").ExcalidrawProps, app: AppClassProperties) => boolean;
    perform: (elements: readonly import("../../element/src/types").OrderedExcalidrawElement[], appState: Readonly<AppState>, _: unknown, app: AppClassProperties) => {
        appState: Readonly<AppState>;
        elements: (import("../../element/src/types").ExcalidrawLinearElement | import("../../element/src/types").ExcalidrawSelectionElement | import("../../element/src/types").ExcalidrawRectangleElement | import("../../element/src/types").ExcalidrawStickyNoteElement | import("../../element/src/types").ExcalidrawDiamondElement | import("../../element/src/types").ExcalidrawEllipseElement | import("../../element/src/types").ExcalidrawEmbeddableElement | import("../../element/src/types").ExcalidrawIframeElement | import("../../element/src/types").ExcalidrawImageElement | import("../../element/src/types").ExcalidrawFrameElement | import("../../element/src/types").ExcalidrawMagicFrameElement | import("../../element/src/types").ExcalidrawTextElement | import("../../element/src/types").ExcalidrawFreeDrawElement)[];
        captureUpdate: "IMMEDIATELY";
    };
    keyTest: (event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean;
    PanelComponent: ({ elements, appState, updateData, app }: import("./types").PanelComponentProps) => import("react/jsx-runtime").JSX.Element;
} & {
    keyTest?: ((event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean) | undefined;
};
export declare const actionAlignVerticallyCentered: {
    name: "alignVerticallyCentered";
    label: string;
    icon: import("react/jsx-runtime").JSX.Element;
    trackEvent: {
        category: "element";
    };
    predicate: (elements: readonly ExcalidrawElement[], appState: AppState, appProps: import("../types").ExcalidrawProps, app: AppClassProperties) => boolean;
    perform: (elements: readonly import("../../element/src/types").OrderedExcalidrawElement[], appState: Readonly<AppState>, _: unknown, app: AppClassProperties) => {
        appState: Readonly<AppState>;
        elements: (import("../../element/src/types").ExcalidrawLinearElement | import("../../element/src/types").ExcalidrawSelectionElement | import("../../element/src/types").ExcalidrawRectangleElement | import("../../element/src/types").ExcalidrawStickyNoteElement | import("../../element/src/types").ExcalidrawDiamondElement | import("../../element/src/types").ExcalidrawEllipseElement | import("../../element/src/types").ExcalidrawEmbeddableElement | import("../../element/src/types").ExcalidrawIframeElement | import("../../element/src/types").ExcalidrawImageElement | import("../../element/src/types").ExcalidrawFrameElement | import("../../element/src/types").ExcalidrawMagicFrameElement | import("../../element/src/types").ExcalidrawTextElement | import("../../element/src/types").ExcalidrawFreeDrawElement)[];
        captureUpdate: "IMMEDIATELY";
    };
    PanelComponent: ({ elements, appState, updateData, app }: import("./types").PanelComponentProps) => import("react/jsx-runtime").JSX.Element;
} & {
    keyTest?: undefined;
};
export declare const actionAlignHorizontallyCentered: {
    name: "alignHorizontallyCentered";
    label: string;
    icon: import("react/jsx-runtime").JSX.Element;
    trackEvent: {
        category: "element";
    };
    predicate: (elements: readonly ExcalidrawElement[], appState: AppState, appProps: import("../types").ExcalidrawProps, app: AppClassProperties) => boolean;
    perform: (elements: readonly import("../../element/src/types").OrderedExcalidrawElement[], appState: Readonly<AppState>, _: unknown, app: AppClassProperties) => {
        appState: Readonly<AppState>;
        elements: (import("../../element/src/types").ExcalidrawLinearElement | import("../../element/src/types").ExcalidrawSelectionElement | import("../../element/src/types").ExcalidrawRectangleElement | import("../../element/src/types").ExcalidrawStickyNoteElement | import("../../element/src/types").ExcalidrawDiamondElement | import("../../element/src/types").ExcalidrawEllipseElement | import("../../element/src/types").ExcalidrawEmbeddableElement | import("../../element/src/types").ExcalidrawIframeElement | import("../../element/src/types").ExcalidrawImageElement | import("../../element/src/types").ExcalidrawFrameElement | import("../../element/src/types").ExcalidrawMagicFrameElement | import("../../element/src/types").ExcalidrawTextElement | import("../../element/src/types").ExcalidrawFreeDrawElement)[];
        captureUpdate: "IMMEDIATELY";
    };
    PanelComponent: ({ elements, appState, updateData, app }: import("./types").PanelComponentProps) => import("react/jsx-runtime").JSX.Element;
} & {
    keyTest?: undefined;
};
