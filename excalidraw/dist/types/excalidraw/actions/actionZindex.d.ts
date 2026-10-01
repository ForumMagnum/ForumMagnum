export declare const actionSendBackward: {
    name: "sendBackward";
    label: string;
    keywords: string[];
    icon: import("react/jsx-runtime").JSX.Element;
    trackEvent: {
        category: "element";
    };
    perform: (elements: readonly import("../../element/src/types").OrderedExcalidrawElement[], appState: Readonly<import("../types").AppState>, value: unknown, app: import("../types").AppClassProperties) => {
        elements: readonly import("../../element/src/types").ExcalidrawElement[];
        appState: Readonly<import("../types").AppState>;
        captureUpdate: "IMMEDIATELY";
    };
    keyPriority: number;
    keyTest: (event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean;
    PanelComponent: ({ updateData, appState }: import("./types").PanelComponentProps) => import("react/jsx-runtime").JSX.Element;
} & {
    keyTest?: ((event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean) | undefined;
};
export declare const actionBringForward: {
    name: "bringForward";
    label: string;
    keywords: string[];
    icon: import("react/jsx-runtime").JSX.Element;
    trackEvent: {
        category: "element";
    };
    perform: (elements: readonly import("../../element/src/types").OrderedExcalidrawElement[], appState: Readonly<import("../types").AppState>, value: unknown, app: import("../types").AppClassProperties) => {
        elements: readonly import("../../element/src/types").ExcalidrawElement[];
        appState: Readonly<import("../types").AppState>;
        captureUpdate: "IMMEDIATELY";
    };
    keyPriority: number;
    keyTest: (event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean;
    PanelComponent: ({ updateData, appState }: import("./types").PanelComponentProps) => import("react/jsx-runtime").JSX.Element;
} & {
    keyTest?: ((event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean) | undefined;
};
export declare const actionSendToBack: {
    name: "sendToBack";
    label: string;
    keywords: string[];
    icon: import("react/jsx-runtime").JSX.Element;
    trackEvent: {
        category: "element";
    };
    perform: (elements: readonly import("../../element/src/types").OrderedExcalidrawElement[], appState: Readonly<import("../types").AppState>) => {
        elements: readonly import("../../element/src/types").ExcalidrawElement[] | import("../../element/src/types").ExcalidrawElement[];
        appState: Readonly<import("../types").AppState>;
        captureUpdate: "IMMEDIATELY";
    };
    keyTest: (event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean;
    PanelComponent: ({ updateData, appState }: import("./types").PanelComponentProps) => import("react/jsx-runtime").JSX.Element;
} & {
    keyTest?: ((event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean) | undefined;
};
export declare const actionBringToFront: {
    name: "bringToFront";
    label: string;
    keywords: string[];
    icon: import("react/jsx-runtime").JSX.Element;
    trackEvent: {
        category: "element";
    };
    perform: (elements: readonly import("../../element/src/types").OrderedExcalidrawElement[], appState: Readonly<import("../types").AppState>) => {
        elements: readonly import("../../element/src/types").ExcalidrawElement[] | import("../../element/src/types").ExcalidrawElement[];
        appState: Readonly<import("../types").AppState>;
        captureUpdate: "IMMEDIATELY";
    };
    keyTest: (event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean;
    PanelComponent: ({ updateData, appState }: import("./types").PanelComponentProps) => import("react/jsx-runtime").JSX.Element;
} & {
    keyTest?: ((event: KeyboardEvent | import("react").KeyboardEvent<Element>) => boolean) | undefined;
};
