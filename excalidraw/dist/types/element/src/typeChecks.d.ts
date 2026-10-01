import type { ElementOrToolType } from "../../excalidraw/types";
import type { MarkNonNullable } from "../../common/src/utility-types";
import type { ExcalidrawElement, ExcalidrawTextElement, ExcalidrawEmbeddableElement, ExcalidrawLinearElement, ExcalidrawBindableElement, ExcalidrawFreeDrawElement, InitializedExcalidrawImageElement, ExcalidrawImageElement, ExcalidrawTextElementWithContainer, ExcalidrawTextContainer, ExcalidrawFrameElement, RoundnessType, ExcalidrawFrameLikeElement, ExcalidrawElementType, ExcalidrawIframeElement, ExcalidrawIframeLikeElement, ExcalidrawMagicFrameElement, ExcalidrawArrowElement, ExcalidrawElbowArrowElement, ExcalidrawLineElement, ExcalidrawFlowchartNodeElement, ExcalidrawLinearElementSubType, ExcalidrawStickyNoteElement } from "./types";
export declare const isInitializedImageElement: <T extends ExcalidrawElement>(element: T | null) => element is T & InitializedExcalidrawImageElement;
export declare const isImageElement: <T extends ExcalidrawElement>(element: T | null) => element is T & ExcalidrawImageElement;
export declare const isEmbeddableElement: <T extends ExcalidrawElement>(element: T | null | undefined) => element is T & ExcalidrawEmbeddableElement;
export declare const isIframeElement: <T extends ExcalidrawElement>(element: T | null) => element is T & ExcalidrawIframeElement;
export declare const isIframeLikeElement: <T extends ExcalidrawElement>(element: T | null) => element is T & ExcalidrawIframeLikeElement;
export declare const isTextElement: <T extends ExcalidrawElement>(element: T | null) => element is T & ExcalidrawTextElement;
export declare const isStickyNoteElement: <T extends ExcalidrawElement>(element: T | null | undefined) => element is T & ExcalidrawStickyNoteElement;
export declare const isFrameElement: <T extends ExcalidrawElement>(element: T | null) => element is T & ExcalidrawFrameElement;
export declare const isMagicFrameElement: <T extends ExcalidrawElement>(element: T | null) => element is T & ExcalidrawMagicFrameElement;
export declare const isFrameLikeElement: <T extends ExcalidrawElement>(element: T | null) => element is T & ExcalidrawFrameLikeElement;
export declare const isFreeDrawElement: <T extends ExcalidrawElement>(element?: T | null) => element is T & ExcalidrawFreeDrawElement;
export declare const isFreeDrawElementType: (elementType: ExcalidrawElementType) => boolean;
export declare const isLinearElement: <T extends ExcalidrawElement>(element?: T | null) => element is T & ExcalidrawLinearElement;
export declare const isLineElement: <T extends ExcalidrawElement>(element?: T | null) => element is T & ExcalidrawLineElement;
export declare const isArrowElement: <T extends ExcalidrawElement>(element?: T | null) => element is T & ExcalidrawArrowElement;
export declare const isElbowArrow: <T extends ExcalidrawElement>(element?: T) => element is T & ExcalidrawElbowArrowElement;
/**
 * sharp or curved arrow, but not elbow
 */
export declare const isSimpleArrow: <T extends ExcalidrawElement>(element?: T) => element is T & ExcalidrawArrowElement;
export declare const isSharpArrow: <T extends ExcalidrawElement>(element?: T) => element is T & ExcalidrawArrowElement;
export declare const isCurvedArrow: <T extends ExcalidrawElement>(element?: T) => element is T & ExcalidrawArrowElement;
export declare const isLinearElementType: (elementType: ElementOrToolType) => boolean;
export declare const isBindingElement: <T extends ExcalidrawElement>(element?: T | null, includeLocked?: boolean) => element is T & ExcalidrawArrowElement;
export declare const isBindingElementType: (elementType: ElementOrToolType) => boolean;
export declare const isBindableElement: <T extends ExcalidrawElement>(element: T | null | undefined, includeLocked?: boolean) => element is T & ExcalidrawBindableElement;
export declare const isRectanguloidElement: <T extends ExcalidrawElement>(element?: T | null) => element is T & ExcalidrawBindableElement;
export declare const isRectangularElement: <T extends ExcalidrawElement>(element?: T | null) => element is T & ExcalidrawBindableElement;
export declare const isTextBindableContainer: <T extends ExcalidrawElement>(element: T | null, includeLocked?: boolean) => element is T & ExcalidrawTextContainer;
export declare const isExcalidrawElement: (element: any) => element is ExcalidrawElement;
export declare const isFlowchartNodeElement: <T extends ExcalidrawElement>(element: T) => element is T & ExcalidrawFlowchartNodeElement;
export declare const hasBoundTextElement: <T extends ExcalidrawElement>(element: T | null) => element is T & MarkNonNullable<ExcalidrawBindableElement, "boundElements">;
export declare const isBoundToContainer: <T extends ExcalidrawElement>(element: T | null) => element is T & ExcalidrawTextElementWithContainer;
export declare const isArrowBoundToElement: (element: ExcalidrawArrowElement) => boolean;
export declare const isUsingAdaptiveRadius: (type: string) => type is "rectangle" | "embeddable" | "iframe" | "image";
export declare const isUsingProportionalRadius: (type: string) => type is "line" | "arrow" | "stickynote" | "diamond";
export declare const canApplyRoundnessTypeToElement: (roundnessType: RoundnessType, element: ExcalidrawElement) => boolean;
export declare const getDefaultRoundnessTypeForElement: (element: ExcalidrawElement) => {
    type: 2;
} | {
    type: 3;
} | null;
export declare const getLinearElementSubType: (element: ExcalidrawLinearElement) => ExcalidrawLinearElementSubType;
/**
 * Checks if current element points meet all the conditions for polygon=true
 * (this isn't a element type check, for that use isLineElement).
 *
 * If you want to check if points *can* be turned into a polygon, use
 *  canBecomePolygon(points).
 */
export declare const isValidPolygon: (points: ExcalidrawLineElement["points"]) => boolean;
export declare const canBecomePolygon: (points: ExcalidrawLineElement["points"]) => boolean;
export declare const isEligibleFrameChildType: (type: ElementOrToolType) => boolean;
