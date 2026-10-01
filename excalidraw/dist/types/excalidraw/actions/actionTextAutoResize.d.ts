import type { ExcalidrawElement } from "../../element/src/types";
export declare const actionTextAutoResize: {
    name: "autoResize";
    label: string;
    icon: null;
    trackEvent: {
        category: "element";
    };
    predicate: (elements: readonly ExcalidrawElement[], appState: import("../types").AppState, _: unknown) => boolean;
    perform: (elements: readonly import("../../element/src/types").OrderedExcalidrawElement[], appState: Readonly<import("../types").AppState>, targetElement: unknown, app: import("../types").AppClassProperties) => false | {
        appState: Readonly<import("../types").AppState>;
        elements: import("../../element/src/types").OrderedExcalidrawElement[];
        captureUpdate: "IMMEDIATELY";
    };
} & {
    keyTest?: undefined;
};
