import type { ArrowEndpoint } from "../../element/src/index";
import type { ExcalidrawTextContainer, ExcalidrawTextElement, NonDeleted } from "../../element/src/types";
import type React from "react";
import type App from "./App";
import type { PointerDownState } from "../types";
type ScenePoint = {
    x: number;
    y: number;
};
/** the modifier state a target depends on — off a pointer or keyboard event */
export type Modifiers = Pick<KeyboardEvent, "ctrlKey" | "metaKey">;
/** What a text-tool click at a position does. */
export type TextToolTarget = 
/** binds a new text to a free arrow endpoint */
{
    type: "endpoint";
    endpoint: ArrowEndpoint;
}
/** edits this text (a label included, at its derived position) */
 | {
    type: "text";
    element: NonDeleted<ExcalidrawTextElement>;
}
/** binds a new label to this empty container (an arrow included) */
 | {
    type: "container";
    element: NonDeleted<ExcalidrawTextContainer>;
}
/** creates free text at the pointer */
 | {
    type: "free";
};
/**
 * The text tool's pointer interaction.
 *
 * Everything hangs off one question — what would a click at this position
 * do (`getTargetAt`)? — answered once and used for the hover affordance
 * (`appState.textToolHover`), the cursor and the pointerdown itself, so the
 * affordance can never promise something the click won't deliver.
 *
 * A click on an empty container's center is armed on pointerdown and
 * committed on pointerup as a bound label; dragging past the autowrap
 * threshold first turns it into a free fixed-width text at the origin
 * instead.
 *
 * Text editing itself (`app.startTextEditing`) is shared with Enter,
 * double-click and the other entry points and stays in `App`.
 */
export declare class AppTextTool {
    private app;
    constructor(app: App);
    /**
     * A click on an empty container's center, armed on pointerdown and decided
     * on the pointer's way out: a click binds a label, a drag creates free
     * text instead. Deferring is what keeps the drag from first binding to
     * (and provisionally enlarging) the container.
     */
    private pending;
    /**
     * The modifiers the hover was last resolved with — what a refresh without
     * an event of its own (the viewport moving under a still pointer) uses.
     */
    private lastModifiers;
    /**
     * What a click at this position would do, in the order the click resolves
     * it: a free arrow endpoint (the smaller, more deliberate target; z-aware,
     * and off while ctrl/cmd disables binding) → the text under the pointer,
     * which the click edits → an empty container near its center, which gets
     * a label unless ctrl/cmd opts out → free text at the pointer.
     *
     * Ctrl/cmd is "no binding" throughout the tool, as elsewhere in the
     * editor. For the container it is read off the event rather than the
     * arrow-binding preference: a label is not an arrow binding.
     */
    getTargetAt: (scenePointer: ScenePoint, modifiers: Modifiers) => TextToolTarget;
    /**
     * Keeps `appState.textToolHover` — the affordance for what a click would
     * do — in sync with the pointer, and returns the target (for the cursor).
     * Suppressed while something else owns the interaction: a text being
     * edited or drag-sized, a multi-point element, a box selection, a drag of
     * the selection, or the pointer over a scrollbar.
     */
    updateHover: (scenePointer: ScenePoint, modifiers: Modifiers, isOverScrollBar?: boolean) => TextToolTarget | null;
    /**
     * Re-resolves the hover — and the cursor that goes with it — where the
     * pointer last was, for what changes a click's outcome without the pointer
     * moving: the ctrl/cmd toggle (pass its event), or the viewport scrolling
     * or zooming under the pointer (no event; the last modifiers stand). The
     * scene position is re-derived from the pointer's viewport position, so a
     * moved viewport resolves what is under the pointer now.
     *
     * Nothing to refresh with another tool or without a hovering pointer — a
     * finger never hovers (its last move is where it lifted), and the
     * affordance a press armed is cleared when the press resolves or is
     * canceled. The cursor is left to viewport navigation (space/wheel
     * panning, a scrollbar drag, the hand tool), as on pointermove.
     */
    refresh: (modifiers?: Modifiers) => void;
    /**
     * Drops a pending center click without acting on it — the tool was left,
     * the browser took the pointer (pointercancel), or a second finger turned
     * the press into a pinch/pan — so no pointerup of ours will decide it. The
     * outline it armed goes with it: while pending, the hover is that click's.
     */
    cancel: () => void;
    clearHover: () => void;
    private setHover;
    /**
     * The cursor for what a click would do: a pointer over the arrow anchors
     * text would attach to, a text cursor over text the click would edit, the
     * tool's crosshair otherwise — also while the affordance is suppressed
     * (editing, drag-sizing), where a click has nothing to point at.
     */
    cursorFor: (target: TextToolTarget | null) => string;
    handlePointerDown: (event: React.PointerEvent<HTMLElement>, pointerDownState: PointerDownState) => void;
    /**
     * The pointer-move half of a pending center click. Once the pointer has
     * moved past the autowrap threshold the click is a drag: free text is
     * created at the origin and sized by the drag from here on. Horizontal
     * only (a text is only ever sized that way) and in screen space, and
     * deliberately wider than the generic drag threshold so a jittery click
     * still binds. Returns whether a pending click owned the move.
     */
    handlePointerMove: (event: PointerEvent, pointerDownState: PointerDownState) => boolean;
    /**
     * The pointer-up half: a genuine pointerup binds the label. The
     * missing-pointerup cleanup replays this with the pointerdown event (a
     * second finger landing mid-press), and a tool switch orphans the click —
     * both discard it instead.
     */
    handlePointerUp: (event: PointerEvent, pointerDownState: PointerDownState) => void;
    private isDrag;
    private resolvePending;
    /**
     * The click has been acted on: drop the affordance, revert the tool unless
     * it is locked, restore the cursor.
     */
    private finish;
}
export {};
