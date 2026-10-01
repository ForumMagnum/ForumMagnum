/**
 * Create and link between shapes.
 */
import type { AppProps, AppState } from "../../excalidraw/types";
import type { ExcalidrawElement } from "./types";
export declare const defaultGetElementLinkFromSelection: Exclude<AppProps["generateLinkForSelection"], undefined>;
export declare const getLinkIdAndTypeFromSelection: (selectedElements: ExcalidrawElement[], appState: AppState) => {
    id: string;
    type: "element" | "group";
} | null;
export declare const canCreateLinkFromElements: (selectedElements: ExcalidrawElement[]) => boolean;
export declare const isElementLink: (url: string) => boolean;
export declare const parseElementLinkFromURL: (url: string) => string | null;
