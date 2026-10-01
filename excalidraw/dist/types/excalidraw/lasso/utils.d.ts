import type { ElementsSegmentsMap, GlobalPoint } from "../../math/src/types";
import type { ElementsMap, ExcalidrawElement } from "../../element/src/types";
import type { BoxSelectionMode } from "../types";
export declare const getLassoSelectedElementIds: (input: {
    lassoPath: GlobalPoint[];
    elements: readonly ExcalidrawElement[];
    elementsMap: ElementsMap;
    elementsSegments: ElementsSegmentsMap;
    intersectedElements: Set<ExcalidrawElement["id"]>;
    enclosedElements: Set<ExcalidrawElement["id"]>;
    simplifyDistance?: number;
    mode?: BoxSelectionMode;
}) => {
    selectedElementIds: string[];
};
