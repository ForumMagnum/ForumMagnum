import { type Radians } from "../../math/src/index";
import type { ExtractSetType } from "../../common/src/utility-types";
import type { Scene } from "./Scene";
import type { MaybeTransformHandleType } from "./transformHandles";
import type { ElementsMap, ExcalidrawElement, ExcalidrawElementType, ExcalidrawTextContainer, ExcalidrawTextElement, ExcalidrawTextElementWithContainer, NonDeleted } from "./types";
export declare const redrawTextBoundingBox: (textElement: ExcalidrawTextElement, container: ExcalidrawElement | null, scene: Scene) => void;
export declare const handleBindTextResize: (container: ExcalidrawElement, scene: Scene, transformHandleType: MaybeTransformHandleType, shouldMaintainAspectRatio?: boolean, shouldResizeFromCenter?: boolean, flipByY?: boolean) => void;
export declare const computeBoundTextPosition: (container: ExcalidrawElement, boundTextElement: ExcalidrawTextElementWithContainer, elementsMap: ElementsMap) => {
    x: number;
    y: number;
};
export declare const getBoundTextElementId: (container: ExcalidrawElement | null) => string | null;
export declare const getBoundTextElement: (element: ExcalidrawElement | null, elementsMap: ElementsMap) => NonDeleted<ExcalidrawTextElementWithContainer> | null;
export declare const getContainerElement: <T extends ExcalidrawTextElement, R extends ExcalidrawTextContainer>(element: T | null, elementsMap: ElementsMap) => R | null;
/**
 * The point a text bound to this container centers on — and, for arrows, the
 * point the text tool snaps a new label to.
 */
export declare const getContainerCenter: (container: ExcalidrawElement, elementsMap: ElementsMap) => {
    x: number;
    y: number;
};
export declare const getContainerCoords: (container: ExcalidrawElement) => {
    x: number;
    y: number;
};
export declare const getTextElementAngle: (textElement: ExcalidrawTextElement, container: ExcalidrawTextContainer | null) => 0 | Radians;
export declare const getBoundTextElementPosition: (container: ExcalidrawElement, boundTextElement: ExcalidrawTextElementWithContainer, elementsMap: ElementsMap) => {
    x: number;
    y: number;
} | undefined;
/**
 * Returns the text element with its accurate coords. An arrow label's
 * position is derived from the arrow at render time rather than kept in
 * sync on the element itself (see getBoundTextElementPosition), so
 * consumers reading a label's coords directly must go through this helper.
 */
export declare const getTextElementWithAccuratePosition: <T extends ExcalidrawTextElement>(textElement: T, elementsMap: ElementsMap) => T;
export declare const shouldAllowVerticalAlign: (selectedElements: readonly ExcalidrawElement[], elementsMap: ElementsMap) => boolean;
export declare const suppportsHorizontalAlign: (selectedElements: readonly ExcalidrawElement[], elementsMap: ElementsMap) => boolean;
declare const VALID_CONTAINER_TYPES: Set<string>;
export declare const isValidTextContainer: (element: {
    type: ExcalidrawElementType;
}) => element is ExcalidrawTextContainer;
export declare const computeContainerDimensionForBoundText: (dimension: number, containerType: ExtractSetType<typeof VALID_CONTAINER_TYPES>) => number;
export declare const getBoundTextMaxWidth: (container: ExcalidrawElement, boundTextElement: ExcalidrawTextElement | null) => number;
export declare const getBoundTextMaxHeight: (container: ExcalidrawElement, boundTextElement: ExcalidrawTextElementWithContainer) => number;
/** retrieves text from text elements and concatenates to a single string */
export declare const getTextFromElements: (elements: readonly ExcalidrawElement[], separator?: string) => string;
export declare const DEFAULT_BOUND_TEXT_LABEL_POSITION = 0.5;
export {};
