import { type GlobalPoint, type LocalPoint } from "../../math/src/index";
import { type ElementUpdate } from "./mutateElement";
import { type ExcalidrawElbowArrowElement, type NonDeletedSceneElementsMap } from "./types";
import type { FixedPointBinding, FixedSegment } from "./types";
export declare const BASE_PADDING = 40;
/**
 *
 */
export declare const updateElbowArrowPoints: (arrow: Readonly<ExcalidrawElbowArrowElement>, elementsMap: NonDeletedSceneElementsMap, updates: {
    points?: readonly LocalPoint[];
    fixedSegments?: readonly FixedSegment[] | null;
    startBinding?: FixedPointBinding | null;
    endBinding?: FixedPointBinding | null;
}, options?: {
    isDragging?: boolean;
    isBindingEnabled?: boolean;
    isMidpointSnappingEnabled?: boolean;
}) => ElementUpdate<ExcalidrawElbowArrowElement>;
export declare const validateElbowPoints: <P extends GlobalPoint | LocalPoint>(points: readonly P[], tolerance?: number) => boolean;
