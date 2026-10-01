import { type ElementUpdate } from "./index";
import type { ExcalidrawElement, NonDeletedExcalidrawElement, NonDeleted, ExcalidrawFrameLikeElement, ElementsMapOrArray, SceneElementsMap, NonDeletedSceneElementsMap, OrderedExcalidrawElement, Ordered } from "./types";
import type { Mutable } from "../../common/src/utility-types";
import type { AppState } from "../../excalidraw/types";
type SceneStateCallback = () => void;
type SceneStateCallbackRemover = () => void;
export type ExcalidrawElementsIncludingDeleted = readonly ExcalidrawElement[];
export declare class Scene {
    private callbacks;
    private nonDeletedElements;
    private nonDeletedElementsMap;
    private elements;
    private nonDeletedFramesLikes;
    private frames;
    private elementsMap;
    private selectedElementsCache;
    /**
     * Random integer regenerated each scene update.
     *
     * Does not relate to elements versions, it's only a renderer
     * cache-invalidation nonce at the moment.
     */
    private sceneNonce;
    getSceneNonce(): number | undefined;
    getNonDeletedElementsMap(): NonDeletedSceneElementsMap;
    getElementsIncludingDeleted(): readonly OrderedExcalidrawElement[];
    getElementsMapIncludingDeleted(): SceneElementsMap;
    getNonDeletedElements(): readonly Ordered<NonDeletedExcalidrawElement>[];
    getFramesIncludingDeleted(): readonly ExcalidrawFrameLikeElement[];
    constructor(elements?: ElementsMapOrArray | null, options?: {
        skipValidation?: true;
    });
    getSelectedElements(opts: {
        selectedElementIds: AppState["selectedElementIds"];
        /**
         * for specific cases where you need to use elements not from current
         * scene state. This in effect will likely result in cache-miss, and
         * the cache won't be updated in this case.
         */
        elements?: ElementsMapOrArray;
        includeBoundTextElement?: boolean;
        includeElementsInFrames?: boolean;
    }): NonDeletedExcalidrawElement[];
    getNonDeletedFramesLikes(): readonly NonDeleted<ExcalidrawFrameLikeElement>[];
    getElement<T extends ExcalidrawElement>(id: T["id"]): T | null;
    getNonDeletedElement(id: ExcalidrawElement["id"]): NonDeleted<ExcalidrawElement> | null;
    /**
     * A utility method to help with updating all scene elements, with the added
     * performance optimization of not renewing the array if no change is made.
     *
     * Maps all current excalidraw elements, invoking the callback for each
     * element. The callback should either return a new mapped element, or the
     * original element if no changes are made. If no changes are made to any
     * element, this results in a no-op. Otherwise, the newly mapped elements
     * are set as the next scene's elements.
     *
     * @returns whether a change was made
     */
    mapElements(iteratee: (element: ExcalidrawElement) => ExcalidrawElement): boolean;
    replaceAllElements(nextElements: ElementsMapOrArray, options?: {
        skipValidation?: true;
    }): void;
    triggerUpdate(): void;
    onUpdate(cb: SceneStateCallback): SceneStateCallbackRemover;
    destroy(): void;
    /** low-level - generally use app.insertNewElements() */
    insertElementsAtIndex(elements: ExcalidrawElement[], 
    /** null indicates end of the array */
    index: number | null): void;
    /** low-level - generally use app.insertNewElement() */
    insertElement: (element: ExcalidrawElement) => void;
    getElementIndex(elementId: string): number;
    getContainerElement: (element: (ExcalidrawElement & {
        containerId: ExcalidrawElement["id"] | null;
    }) | null) => import("./types").ExcalidrawLinearElement | import("./types").ExcalidrawSelectionElement | import("./types").ExcalidrawRectangleElement | import("./types").ExcalidrawStickyNoteElement | import("./types").ExcalidrawDiamondElement | import("./types").ExcalidrawEllipseElement | import("./types").ExcalidrawEmbeddableElement | import("./types").ExcalidrawIframeElement | import("./types").ExcalidrawImageElement | import("./types").ExcalidrawFrameElement | import("./types").ExcalidrawMagicFrameElement | import("./types").ExcalidrawTextElement | import("./types").ExcalidrawFreeDrawElement | null;
    getElementsFromId: (id: string) => ExcalidrawElement[];
    mutateElement<TElement extends Mutable<ExcalidrawElement>>(element: TElement, updates: ElementUpdate<TElement>, options?: {
        informMutation: boolean;
        isDragging: boolean;
        isBindingEnabled?: boolean;
        isMidpointSnappingEnabled?: boolean;
    }): TElement;
}
export {};
