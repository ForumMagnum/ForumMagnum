import type { GlobalPoint } from "../../math/src/index";
import type { AppState } from "../../excalidraw/types";
import type { ElementsMap, ExcalidrawArrowElement, ExcalidrawTextElement, FixedPoint, NonDeleted, NonDeletedExcalidrawElement, TextAlign, VerticalAlign } from "./types";
export type ArrowEndpoint = {
    arrow: NonDeleted<ExcalidrawArrowElement>;
    startOrEnd: "start" | "end";
};
/**
 * Finds a free (unbound) arrow endpoint under the cursor, front-most first.
 * Used by the text tool to offer creating a text label anchored to the tip of
 * an arrow.
 */
export declare const getUnboundArrowEndpointAtPoint: (scenePointer: GlobalPoint, elements: readonly NonDeletedExcalidrawElement[], elementsMap: ElementsMap, zoom: AppState["zoom"]) => ArrowEndpoint | null;
/**
 * Describes how a text element should be created so that it reads as a label
 * for the given arrow endpoint.
 *
 * The arrow is treated as fixed: rather than routing the arrow to the text, we
 * pick the side of the text the arrow should attach to (the one it already
 * points at), and place the text so that side's midpoint lands on the existing
 * endpoint. The alignment returned pins that same midpoint while the text is
 * typed, so the arrow doesn't swing around during editing.
 */
export declare const getTextBindingForArrowEndpoint: (arrow: NonDeleted<ExcalidrawArrowElement>, startOrEnd: "start" | "end", elementsMap: ElementsMap, 
/**
 * stroke width the text will be created with — the binding gap is derived
 * from the *bind target*, so using the arrow's would offset the anchor by
 * half the difference between the two
 */
targetStrokeWidth: number) => {
    /** the text-local ratio the arrow binds to (a side midpoint) */
    fixedPoint: FixedPoint;
    textAlign: TextAlign;
    verticalAlign: VerticalAlign;
    /** scene position the text's bound side midpoint should sit at */
    anchor: GlobalPoint;
} | null;
/**
 * Whether an arrow endpoint is bound to this text — i.e. the text serves as an
 * arrow-endpoint label. Checked on the arrows' own bindings: the text's
 * `boundElements` only says an arrow relates to it, while the binding on the
 * arrow is the authoritative side of the relationship.
 */
export declare const isEndpointBoundText: (text: ExcalidrawTextElement, elementsMap: ElementsMap) => boolean;
/** the anchor a text bound to an arrow endpoint grows away from */
export declare const getEndpointBoundTextDragAnchor: (newElement: ExcalidrawTextElement) => {
    anchorRatio: number;
    anchorX: number;
};
