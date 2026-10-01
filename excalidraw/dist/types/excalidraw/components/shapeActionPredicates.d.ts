import type { ElementsMap, ExcalidrawElement, NonDeletedElementsMap, NonDeletedSceneElementsMap } from "../../element/src/types";
import type { AppClassProperties, UIAppState } from "../types";
export declare const canChangeStrokeColor: (appState: UIAppState, targetElements: ExcalidrawElement[]) => boolean;
export declare const canChangeBackgroundColor: (appState: UIAppState, targetElements: ExcalidrawElement[], elementsMap: ElementsMap) => boolean;
/**
 * Single source of truth for "which shape-action controls are relevant right
 * now". Each flag answers whether a given control should be shown, given the
 * active tool and the current selection. All three styles-panel layouts
 * (full / compact / mobile) and the compact popovers consume these flags so
 * that visibility logic lives in one place and layout stays pure.
 */
export declare const getShapeActionPredicates: (appState: UIAppState, targetElements: ExcalidrawElement[], elementsMap: NonDeletedElementsMap | NonDeletedSceneElementsMap, app: AppClassProperties) => {
    /** some element(s) selected */
    hasSelection: boolean;
    /** actions on selected elements (delete/duplicate/...) */
    showExtraActions: boolean;
    strokeColor: boolean;
    backgroundColor: boolean;
    fill: boolean;
    strokeWidth: boolean;
    freedrawMode: boolean;
    strokeStyle: boolean;
    sloppiness: boolean;
    roundness: boolean;
    arrowType: boolean;
    arrowheads: boolean;
    text: boolean;
    textAlign: boolean;
    verticalAlign: boolean;
    opacity: boolean;
    layers: boolean;
    align: boolean;
    distribute: boolean;
    link: boolean;
    linkSingleOnly: boolean;
    cropEditor: boolean;
    lineEditor: boolean;
};
export type ShapeActionPredicates = ReturnType<typeof getShapeActionPredicates>;
