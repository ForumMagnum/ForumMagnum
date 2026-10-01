import type { AppClassProperties, AppState } from "../types";
export declare const distributeHorizontally: {
    name: "distributeHorizontally";
    label: string;
    trackEvent: {
        category: "element";
    };
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
export declare const distributeVertically: {
    name: "distributeVertically";
    label: string;
    trackEvent: {
        category: "element";
    };
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
