import { LinearElementEditor } from "../../element/src/index";
import type { ArrowEndpoint } from "../../element/src/index";
import type { ExcalidrawElement, ExcalidrawTextElement, FixedPoint, NonDeleted, NonDeletedExcalidrawElement } from "../../element/src/types";
import type App from "./App";
import type { PointerDownState } from "../types";
/**
 * Text ↔ arrow interactions.
 *
 * With the text tool: the free endpoint a click would bind a new text to
 * (`AppTextTool` resolves and shows it), the binding itself, and the
 * endpoint-bound flavor of drag-sizing a new text.
 *
 * With the selection tool: dragging an arrow's existing label along the arrow
 * — the grab affordance and the drag itself.
 *
 * The scene-level logic lives in `@excalidraw/element`'s
 * `arrowEndpointText.ts` and `linearElementEditor.ts`.
 */
export declare class AppArrowText {
    private app;
    constructor(app: App);
    /**
     * A free arrow endpoint a new text could be bound to. Binding an endpoint is
     * an arrow binding, so it follows the binding toggle (ctrl/cmd) like every
     * other one — holding it makes the text tool drop plain text instead.
     */
    getBindableEndpointAtPosition(x: number, y: number): ArrowEndpoint | null;
    /**
     * How a text should be created to read as a label for this endpoint — the
     * side midpoint to bind, the alignment that pins it, and the scene position
     * it must sit at. `targetStrokeWidth` is the caller's to provide so it can
     * guarantee it matches the stroke width the text is then created with — the
     * binding gap derives from it (see `getTextBindingForArrowEndpoint`).
     */
    getTextBinding({ arrow, startOrEnd }: ArrowEndpoint, targetStrokeWidth: number): {
        fixedPoint: FixedPoint;
        textAlign: import("../../element/src/types").TextAlign;
        verticalAlign: import("../../element/src/types").VerticalAlign;
        anchor: import("../../math/src/index").GlobalPoint;
    } | null;
    /**
     * Binds the arrow endpoint to the created text, at the side midpoint the
     * placement resolved (`getTextBinding`'s `fixedPoint`).
     */
    bindText({ arrow, startOrEnd }: ArrowEndpoint, text: NonDeleted<ExcalidrawTextElement>, fixedPoint: FixedPoint): void;
    /**
     * A text bound to an arrow endpoint can't be positioned by the drag — the
     * binding already placed it — so only its width is dragged out. Returns
     * whether it owned the drag.
     */
    maybeDragNewText(newElement: ExcalidrawElement, pointerCoords: {
        x: number;
        y: number;
    }): boolean;
    /**
     * Whether the arrow's label is what a grab at this position would pick up:
     * the pointer is over the label, and no element stacked above the arrow
     * owns the hit instead.
     */
    isBoundTextGrabbable(element: NonDeletedExcalidrawElement, x: number, y: number): boolean;
    /**
     * The pointer-move half of dragging a label along its arrow. Owns the move
     * whenever the gesture started on the label (`pointerDownState.hit.arrowLabel`),
     * dragging only once past the threshold. Returns whether it owned it.
     */
    maybeDragLabel(linearElementEditor: LinearElementEditor, pointerDownState: PointerDownState, pointerCoords: {
        x: number;
        y: number;
    }): boolean;
}
