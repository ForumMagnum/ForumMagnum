import type { AppClassProperties, AppState, StaticCanvasAppState } from "../../excalidraw/types";
import type { ReadonlySetLike } from "../../common/src/utility-types";
import type { ExcalidrawElementsIncludingDeleted } from "./Scene";
import type { ElementsMap, ElementsMapOrArray, ExcalidrawElement, ExcalidrawFrameLikeElement, NonDeleted, NonDeletedExcalidrawElement } from "./types";
export declare const bindElementsToFramesAfterDuplication: (nextElements: readonly ExcalidrawElement[], origElements: readonly ExcalidrawElement[], origIdToDuplicateId: Map<ExcalidrawElement["id"], ExcalidrawElement["id"]>) => void;
export declare function isElementIntersectingFrame(element: ExcalidrawElement, frame: ExcalidrawFrameLikeElement, elementsMap: ElementsMap): boolean;
export declare const getElementsCompletelyInFrame: (elements: readonly ExcalidrawElement[], frame: ExcalidrawFrameLikeElement, elementsMap: ElementsMap) => ExcalidrawElement[];
export declare const isElementContainingFrame: (element: ExcalidrawElement, frame: ExcalidrawFrameLikeElement, elementsMap: ElementsMap) => boolean;
export declare const getElementsIntersectingFrame: (elements: readonly ExcalidrawElement[], frame: ExcalidrawFrameLikeElement) => ExcalidrawElement[];
export declare const elementsAreInFrameBounds: (elements: readonly ExcalidrawElement[], frame: ExcalidrawFrameLikeElement, elementsMap: ElementsMap) => boolean;
export declare const elementOverlapsWithFrame: (element: ExcalidrawElement, frame: ExcalidrawFrameLikeElement, elementsMap: ElementsMap) => boolean;
export declare const isCursorInFrame: (cursorCoords: {
    x: number;
    y: number;
}, frame: NonDeleted<ExcalidrawFrameLikeElement>, elementsMap: ElementsMap) => boolean;
export declare const groupsAreAtLeastIntersectingTheFrame: (elements: readonly NonDeletedExcalidrawElement[], groupIds: readonly string[], frame: ExcalidrawFrameLikeElement) => boolean;
export declare const groupsAreCompletelyOutOfFrame: (elements: readonly NonDeletedExcalidrawElement[], groupIds: readonly string[], frame: ExcalidrawFrameLikeElement) => boolean;
/**
 * Returns a map of frameId to frame elements. Includes empty frames.
 */
export declare const groupByFrameLikes: (elements: readonly ExcalidrawElement[]) => Map<string, ExcalidrawElement[]>;
export declare const getFrameChildren: (allElements: ElementsMapOrArray, frameId: string) => ExcalidrawElement[];
export declare const getFrameLikeElements: (allElements: ExcalidrawElementsIncludingDeleted) => ExcalidrawFrameLikeElement[];
/**
 * Returns ExcalidrawFrameElements and non-frame-children elements.
 *
 * Considers children as root elements if they point to a frame parent
 * non-existing in the elements set.
 *
 * Considers non-frame bound elements (container or arrow labels) as root.
 */
export declare const getRootElements: <T extends ExcalidrawElement>(allElements: readonly T[]) => T[];
export declare const getElementsInResizingFrame: (allElements: ExcalidrawElementsIncludingDeleted, frame: ExcalidrawFrameLikeElement, appState: AppState, elementsMap: ElementsMap) => ExcalidrawElement[];
export declare const getElementsInNewFrame: (elements: ExcalidrawElementsIncludingDeleted, frame: ExcalidrawFrameLikeElement, elementsMap: ElementsMap) => (import("./types").ExcalidrawLinearElement | import("./types").ExcalidrawSelectionElement | import("./types").ExcalidrawRectangleElement | import("./types").ExcalidrawStickyNoteElement | import("./types").ExcalidrawDiamondElement | import("./types").ExcalidrawEllipseElement | import("./types").ExcalidrawEmbeddableElement | import("./types").ExcalidrawIframeElement | import("./types").ExcalidrawImageElement | import("./types").ExcalidrawFrameElement | import("./types").ExcalidrawMagicFrameElement | import("./types").ExcalidrawTextElement | import("./types").ExcalidrawFreeDrawElement)[];
export declare const omitPartialGroups: (elements: ExcalidrawElement[], frame: ExcalidrawFrameLikeElement, allElementsMap: ElementsMap) => (import("./types").ExcalidrawLinearElement | import("./types").ExcalidrawSelectionElement | import("./types").ExcalidrawRectangleElement | import("./types").ExcalidrawStickyNoteElement | import("./types").ExcalidrawDiamondElement | import("./types").ExcalidrawEllipseElement | import("./types").ExcalidrawEmbeddableElement | import("./types").ExcalidrawIframeElement | import("./types").ExcalidrawImageElement | import("./types").ExcalidrawFrameElement | import("./types").ExcalidrawMagicFrameElement | import("./types").ExcalidrawTextElement | import("./types").ExcalidrawFreeDrawElement)[];
export declare const getContainingFrame: (element: ExcalidrawElement, elementsMap: ElementsMap) => ExcalidrawFrameLikeElement | null;
/** */
export declare const filterElementsEligibleAsFrameChildren: (elements: readonly ExcalidrawElement[], frame: ExcalidrawFrameLikeElement) => ExcalidrawElement[];
export declare const getCommonFrameId: (elements: readonly ExcalidrawElement[]) => string | null;
export declare const getFrameChildrenInsertionIndex: (elements: readonly ExcalidrawElement[], frameId: ExcalidrawFrameLikeElement["id"]) => number | null;
/**
 * Adds elements and their bound elements to frame. Reorders added elements to
 * be just below frame, or just above its highest child (whichever is higher).
 *
 * @returns mutated allElements (same data structure)
 */
export declare const addElementsToFrame: <T extends ElementsMapOrArray>(allElements: T, elementsToAdd: ExcalidrawElement[], frame: ExcalidrawFrameLikeElement) => T;
export declare const removeElementsFromFrame: (elementsToRemove: ReadonlySetLike<ExcalidrawElement>, elementsMap: ElementsMap) => void;
export declare const removeAllElementsFromFrame: <T extends ExcalidrawElement>(allElements: readonly T[], frame: ExcalidrawFrameLikeElement) => readonly T[];
export declare const replaceAllElementsInFrame: <T extends ExcalidrawElement>(allElements: readonly T[], nextElementsInFrame: ExcalidrawElement[], frame: ExcalidrawFrameLikeElement) => T[];
/** does not mutate elements, but returns new ones */
export declare const updateFrameMembershipOfSelectedElements: <T extends ElementsMapOrArray>(allElements: T, appState: AppState, app: AppClassProperties) => T;
/**
 * filters out elements that are inside groups that contain a frame element
 * anywhere in the group tree
 */
export declare const omitGroupsContainingFrameLikes: (allElements: ElementsMapOrArray, 
/** subset of elements you want to filter. Optional perf optimization so we
 * don't have to filter all elements unnecessarily
 */
selectedElements?: readonly ExcalidrawElement[]) => ExcalidrawElement[];
/**
 * depending on the appState, return target frame, which is the frame the given element
 * is going to be added to or remove from
 */
export declare const getTargetFrame: (element: ExcalidrawElement, elementsMap: ElementsMap, appState: StaticCanvasAppState) => ExcalidrawFrameLikeElement | null;
export declare const isElementInFrame: (element: ExcalidrawElement, allElementsMap: ElementsMap, appState: StaticCanvasAppState, opts?: {
    targetFrame?: ExcalidrawFrameLikeElement;
    checkedGroups?: Map<string, boolean>;
}) => boolean;
export declare const shouldApplyFrameClip: (element: ExcalidrawElement, frame: ExcalidrawFrameLikeElement, appState: StaticCanvasAppState, elementsMap: ElementsMap, checkedGroups?: Map<string, boolean>) => boolean;
export declare const getDefaultFrameName: (element: ExcalidrawFrameLikeElement) => "Frame" | "AI Frame";
export declare const getFrameLikeTitle: (element: ExcalidrawFrameLikeElement) => string;
export declare const getElementsOverlappingFrame: <T extends ExcalidrawElement>(elements: readonly T[], frame: ExcalidrawFrameLikeElement, elementsMap: ElementsMap) => T[];
export declare const frameAndChildrenSelectedTogether: (selectedElements: readonly ExcalidrawElement[]) => boolean;
