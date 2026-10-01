import { type GlobalPoint } from "../../math/src/index";
import type { Curve, LineSegment } from "../../math/src/index";
import type { AppState, Zoom } from "../../excalidraw/types";
import type { ElementsMap, ExcalidrawArrowElement, ExcalidrawBindableElement, ExcalidrawDiamondElement, ExcalidrawElement, ExcalidrawFreeDrawElement, ExcalidrawLinearElement, ExcalidrawRectanguloidElement } from "./types";
export type LinearPathSegment = LineSegment<GlobalPoint> | Curve<GlobalPoint>;
type ElementShape = [LineSegment<GlobalPoint>[], Curve<GlobalPoint>[]];
/**
 * Returns the **rotated** components of freedraw, line or arrow elements.
 *
 * @param element The linear element to deconstruct
 * @returns The rotated in components.
 */
export declare function deconstructLinearOrFreeDrawElement(element: ExcalidrawLinearElement | ExcalidrawFreeDrawElement, elementsMap: ElementsMap): ElementShape;
export declare function getLinearElementPathSegments(element: ExcalidrawLinearElement | ExcalidrawFreeDrawElement, elementsMap: ElementsMap): LinearPathSegment[];
/**
 * Get the building components of a rectanguloid element in the form of
 * line segments and curves **unrotated**.
 *
 * @param element Target rectanguloid element
 * @param offset Optional offset to expand the rectanguloid shape
 * @returns Tuple of **unrotated** line segments (0) and curves (1)
 */
export declare function deconstructRectanguloidElement(element: ExcalidrawRectanguloidElement, offset?: number): ElementShape;
export declare function getDiamondBaseCorners(element: ExcalidrawDiamondElement, offset?: number): Curve<GlobalPoint>[];
/**
 * Get the **unrotated** building components of a diamond element
 * in the form of line segments and curves as a tuple, in this order.
 *
 * @param element The element to deconstruct
 * @param offset An optional offset
 * @returns Tuple of line **unrotated** segments (0) and curves (1)
 */
export declare function deconstructDiamondElement(element: ExcalidrawDiamondElement, offset?: number): ElementShape;
export declare const isPathALoop: (points: ExcalidrawLinearElement["points"], 
/** supply if you want the loop detection to account for current zoom */
zoomValue?: Zoom["value"]) => boolean;
export declare const getCornerRadius: (x: number, element: ExcalidrawElement) => number;
export declare const getAllMidpoints: (element: ExcalidrawBindableElement, elementsMap: ElementsMap) => GlobalPoint[];
export declare const getElbowArrowSnapMidPoint: (point: GlobalPoint, element: ExcalidrawBindableElement, elementsMap: ElementsMap, zoom: AppState["zoom"]) => {
    point: GlobalPoint;
    onAxis: boolean;
} | undefined;
export declare const getSnapOutlineMidPoint: (point: GlobalPoint, element: ExcalidrawBindableElement, elementsMap: ElementsMap, zoom: AppState["zoom"], arrow: {
    elbowed: boolean;
}) => GlobalPoint | undefined;
export declare const projectFixedPointOntoDiagonal: (arrow: ExcalidrawArrowElement, point: GlobalPoint, element: ExcalidrawBindableElement, startOrEnd: "start" | "end", elementsMap: ElementsMap, zoom: AppState["zoom"], isMidpointSnappingEnabled?: boolean) => GlobalPoint | null;
export {};
