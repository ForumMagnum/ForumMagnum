import { type GlobalPoint } from "../../math/src/index";
import type { LineSegment, LocalPoint } from "../../math/src/index";
import type { AppState, NullableGridSize } from "../../excalidraw/types";
import type { Bounds } from "../../common/src/index";
import { type Heading } from "./heading";
import type { Scene } from "./Scene";
import type { ElementUpdate } from "./mutateElement";
import type { BindMode, ElementsMap, ExcalidrawArrowElement, ExcalidrawBindableElement, ExcalidrawElbowArrowElement, ExcalidrawElement, FixedPoint, FixedPointBinding, NonDeleted, NonDeletedExcalidrawElement, NonDeletedSceneElementsMap, Ordered, PointsPositionUpdates } from "./types";
export type BindingStrategy = {
    mode: BindMode;
    element: NonDeleted<ExcalidrawBindableElement>;
    focusPoint: GlobalPoint;
} | {
    mode: null;
    element?: undefined;
    focusPoint?: undefined;
} | {
    mode: undefined;
    element?: undefined;
    focusPoint?: undefined;
};
/**
 * gaps exclude element strokeWidth
 *
 * IMPORTANT: currently must be > 0 (this also applies to the computed gap)
 */
export declare const BASE_BINDING_GAP = 5;
export declare const BASE_ARROW_MIN_LENGTH = 10;
export declare const FOCUS_POINT_SIZE: number;
export declare const getBindingGap: (bindTarget: Pick<ExcalidrawBindableElement, "strokeWidth">) => number;
export declare const maxBindingDistance_simple: (zoom?: AppState["zoom"]) => number;
export declare const isBindingEnabled: (appState: {
    isBindingEnabled: AppState["isBindingEnabled"];
}) => boolean;
export declare const bindOrUnbindBindingElement: (arrow: NonDeleted<ExcalidrawArrowElement>, draggingPoints: PointsPositionUpdates, scenePointerX: number, scenePointerY: number, scene: Scene, appState: AppState, opts?: {
    newArrow?: boolean;
    altKey?: boolean;
    angleLocked?: boolean;
    initialBinding?: boolean;
    gridSize?: NullableGridSize;
}) => {
    start: BindingStrategy;
    end: BindingStrategy;
};
export declare const getBindingStrategyForDraggingBindingElementEndpoints: (arrow: NonDeleted<ExcalidrawArrowElement>, draggingPoints: PointsPositionUpdates, screenPointerX: number, screenPointerY: number, elementsMap: NonDeletedSceneElementsMap, elements: readonly Ordered<NonDeletedExcalidrawElement>[], appState: AppState, opts?: {
    newArrow?: boolean;
    angleLocked?: boolean;
    altKey?: boolean;
    finalize?: boolean;
    initialBinding?: boolean;
    gridSize?: NullableGridSize;
}) => {
    start: BindingStrategy;
    end: BindingStrategy;
};
export declare const bindOrUnbindBindingElements: (selectedArrows: NonDeleted<ExcalidrawArrowElement>[], scene: Scene, appState: AppState) => void;
export declare const bindBindingElement: (arrow: NonDeleted<ExcalidrawArrowElement>, hoveredElement: NonDeleted<ExcalidrawBindableElement>, mode: BindMode, startOrEnd: "start" | "end", scene: Scene, zoom: AppState["zoom"], focusPoint?: GlobalPoint, shouldSnapToOutline?: boolean, isMidpointSnappingEnabled?: boolean) => void;
export declare const unbindBindingElement: (arrow: ExcalidrawArrowElement, startOrEnd: "start" | "end", scene: Scene) => ExcalidrawBindableElement["id"] | null;
export declare const reanchorBindingsToOutline: (changedElement: NonDeleted<ExcalidrawBindableElement>, scene: Scene, zoom: AppState["zoom"]) => void;
export declare const updateBoundElements: (changedElement: NonDeletedExcalidrawElement, scene: Scene, options?: {
    /** see `getSimultaneouslyUpdatedElementIds` for how to pass it */
    simultaneouslyUpdated?: readonly NonDeletedExcalidrawElement[];
    changedElements?: Map<string, ExcalidrawElement>;
}) => void;
export declare const updateBindings: (latestElement: NonDeletedExcalidrawElement, scene: Scene, appState: AppState, options?: {
    simultaneouslyUpdated?: readonly NonDeletedExcalidrawElement[];
    newSize?: {
        width: number;
        height: number;
    };
}) => void;
/**
 * The id set of `simultaneouslyUpdated`, shared by every `updateBoundElements()`
 * call given the same array. Pass one array instance for all elements of an
 * operation, and don't change its membership after the first lookup, or the
 * cached ids go stale.
 */
export declare const getSimultaneouslyUpdatedElementIds: (simultaneouslyUpdated: readonly ExcalidrawElement[] | undefined) => ReadonlySet<ExcalidrawElement["id"]>;
export declare const getHeadingForElbowArrowSnap: (p: Readonly<GlobalPoint>, otherPoint: Readonly<GlobalPoint>, bindableElement: ExcalidrawBindableElement | undefined | null, aabb: Bounds | undefined | null, origPoint: GlobalPoint, elementsMap: ElementsMap, zoom?: AppState["zoom"]) => Heading;
export declare const bindPointToSnapToElementOutline: (arrowElement: ExcalidrawArrowElement, bindableElement: ExcalidrawBindableElement, startOrEnd: "start" | "end", elementsMap: ElementsMap, zoom: AppState["zoom"], customIntersector?: LineSegment<GlobalPoint>, isMidpointSnappingEnabled?: boolean) => GlobalPoint;
export declare const avoidRectangularCorner: (arrowElement: ExcalidrawArrowElement, bindTarget: ExcalidrawBindableElement, elementsMap: ElementsMap, p: GlobalPoint) => GlobalPoint;
export declare const updateBoundPoint: (arrow: NonDeleted<ExcalidrawArrowElement>, startOrEnd: "startBinding" | "endBinding", binding: FixedPointBinding | null | undefined, bindableElement: ExcalidrawBindableElement, elementsMap: ElementsMap, dragging?: boolean) => LocalPoint | null;
export declare const calculateFixedPointForElbowArrowBinding: (linearElement: NonDeleted<ExcalidrawElbowArrowElement>, hoveredElement: ExcalidrawBindableElement, startOrEnd: "start" | "end", elementsMap: ElementsMap, zoom: AppState["zoom"], shouldSnapToOutline?: boolean, isMidpointSnappingEnabled?: boolean) => {
    fixedPoint: FixedPoint;
};
export declare const calculateFixedPointForNonElbowArrowBinding: (linearElement: NonDeleted<ExcalidrawArrowElement>, hoveredElement: NonDeleted<ExcalidrawBindableElement>, startOrEnd: "start" | "end", elementsMap: ElementsMap, focusPoint?: GlobalPoint) => {
    fixedPoint: FixedPoint;
};
export declare const fixDuplicatedBindingsAfterDuplication: (duplicatedElements: ExcalidrawElement[], origIdToDuplicateId: Map<ExcalidrawElement["id"], ExcalidrawElement["id"]>, duplicateElementsMap: NonDeletedSceneElementsMap) => void;
export declare const fixBindingsAfterDeletion: (sceneElements: readonly ExcalidrawElement[], deletedElements: readonly ExcalidrawElement[]) => void;
export declare const bindingProperties: Set<BindableProp | BindingProp>;
export type BindableProp = "boundElements";
export type BindingProp = "frameId" | "containerId" | "startBinding" | "endBinding";
/**
 * Bound element containing bindings to `frameId`, `containerId`, `startBinding` or `endBinding`.
 */
export declare class BoundElement {
    /**
     * Unbind the affected non deleted bindable elements (removing element from `boundElements`).
     * - iterates non deleted bindable elements (`containerId` | `startBinding.elementId` | `endBinding.elementId`) of the current element
     * - prepares updates to unbind each bindable element's `boundElements` from the current element
     */
    static unbindAffected(elements: ElementsMap, boundElement: ExcalidrawElement | undefined, updateElementWith: (affected: ExcalidrawElement, updates: ElementUpdate<ExcalidrawElement>) => void): void;
    /**
     * Rebind the next affected non deleted bindable elements (adding element to `boundElements`).
     * - iterates non deleted bindable elements (`containerId` | `startBinding.elementId` | `endBinding.elementId`) of the current element
     * - prepares updates to rebind each bindable element's `boundElements` to the current element
     *
     * NOTE: rebind expects that affected elements were previously unbound with `BoundElement.unbindAffected`
     */
    static rebindAffected: (elements: ElementsMap, boundElement: ExcalidrawElement | undefined, updateElementWith: (affected: ExcalidrawElement, updates: ElementUpdate<ExcalidrawElement>) => void) => void;
}
/**
 * Bindable element containing bindings to `boundElements`.
 */
export declare class BindableElement {
    /**
     * Unbind the affected non deleted bound elements (resetting `containerId`, `startBinding`, `endBinding` to `null`).
     * - iterates through non deleted `boundElements` of the current element
     * - prepares updates to unbind each bound element from the current element
     */
    static unbindAffected(elements: ElementsMap, bindableElement: ExcalidrawElement | undefined, updateElementWith: (affected: ExcalidrawElement, updates: ElementUpdate<ExcalidrawElement>) => void): void;
    /**
     * Rebind the affected non deleted bound elements (for now setting only `containerId`, as we cannot rebind arrows atm).
     * - iterates through non deleted `boundElements` of the current element
     * - prepares updates to rebind each bound element to the current element or unbind it from `boundElements` in case of conflicts
     *
     * NOTE: rebind expects that affected elements were previously unbound with `BindaleElement.unbindAffected`
     */
    static rebindAffected: (elements: ElementsMap, bindableElement: ExcalidrawElement | undefined, updateElementWith: (affected: ExcalidrawElement, updates: ElementUpdate<ExcalidrawElement>) => void) => void;
}
export declare const getGlobalFixedPointForBindableElement: (fixedPointRatio: FixedPoint, element: ExcalidrawBindableElement, elementsMap: ElementsMap) => GlobalPoint;
export declare const getGlobalFixedPoints: (arrow: ExcalidrawArrowElement, elementsMap: ElementsMap) => [GlobalPoint, GlobalPoint];
export declare const getArrowLocalFixedPoints: (arrow: ExcalidrawElbowArrowElement, elementsMap: ElementsMap) => LocalPoint[];
export declare const isFixedPoint: (fixedPoint: any) => fixedPoint is FixedPointBinding["fixedPoint"];
export declare const normalizeFixedPoint: <T extends FixedPoint>(fixedPoint: T) => FixedPoint;
export declare const getBindingSideMidPoint: (binding: FixedPointBinding, elementsMap: ElementsMap) => GlobalPoint | LocalPoint | null;
/**
 * Binds an arrow endpoint to an explicit fixed point on a bindable element,
 * bypassing the "derive the ratio from where the endpoint currently is"
 * strategy used when dragging. Needed when the binding target is placed to fit
 * the arrow rather than the other way round.
 */
export declare const bindBindingElementToFixedPoint: (arrow: NonDeleted<ExcalidrawArrowElement>, bindableElement: NonDeleted<ExcalidrawBindableElement>, startOrEnd: "start" | "end", fixedPoint: FixedPoint, scene: Scene) => void;
