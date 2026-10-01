import type { ExcalidrawElement } from "../../element/src/types";
export declare const actionToggleShapeSwitch: {
    name: "toggleShapeSwitch";
    label: string;
    icon: () => null;
    viewMode: true;
    trackEvent: {
        category: "shape_switch";
        action: string;
    };
    keywords: string[];
    perform(elements: readonly import("../../element/src/types").OrderedExcalidrawElement[], appState: Readonly<import("../types").AppState>, _: unknown, app: import("../types").AppClassProperties): {
        captureUpdate: "NEVER";
    };
    checked: (appState: Readonly<import("../types").UIAppState>) => boolean;
    predicate: (elements: readonly ExcalidrawElement[], appState: import("../types").AppState, props: import("../types").ExcalidrawProps) => boolean;
} & {
    keyTest?: undefined;
};
