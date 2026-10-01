import type { ExcalidrawTextContainer } from "./types";
export declare const originalContainerCache: {
    [id: ExcalidrawTextContainer["id"]]: {
        height: ExcalidrawTextContainer["height"];
    } | undefined;
};
export declare const updateOriginalContainerCache: (id: ExcalidrawTextContainer["id"], height: ExcalidrawTextContainer["height"]) => {
    height: ExcalidrawTextContainer["height"];
};
export declare const resetOriginalContainerCache: (id: ExcalidrawTextContainer["id"]) => void;
export declare const getOriginalContainerHeightFromCache: (id: ExcalidrawTextContainer["id"]) => number | null;
