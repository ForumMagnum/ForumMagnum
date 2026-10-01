import type { Mutable } from "../../common/src/utility-types";
import type { ElementsMap, ExcalidrawElement } from "./types";
export type ElementUpdate<TElement extends ExcalidrawElement> = Omit<Partial<TElement>, "id" | "updated" | "created">;
/**
 * This function tracks updates of text elements for the purposes for collaboration.
 * The version is used to compare updates when more than one user is working in
 * the same drawing.
 *
 * WARNING: this won't trigger the component to update, so if you need to trigger component update,
 * use `scene.mutateElement` or `ExcalidrawImperativeAPI.mutateElement` instead.
 */
export declare const mutateElement: <TElement extends Mutable<ExcalidrawElement>>(element: TElement, elementsMap: ElementsMap, updates: ElementUpdate<TElement>, options?: {
    isDragging?: boolean;
    isBindingEnabled?: boolean;
    isMidpointSnappingEnabled?: boolean;
}) => TElement;
export declare const newElementWith: <TElement extends ExcalidrawElement>(element: TElement, updates: ElementUpdate<TElement>, 
/** pass `true` to always regenerate */
force?: boolean) => TElement;
/**
 * Mutates element, bumping `version`, `versionNonce`, and `updated`.
 *
 * NOTE: does not trigger re-render.
 */
export declare const bumpVersion: <T extends Mutable<ExcalidrawElement>>(element: T, version?: ExcalidrawElement["version"]) => T;
