import { DrawShapeTrail } from "../drawShapeTrail";
import type App from "./App";
import type { PointerDownState } from "../types";
/**
 * Captures the App state management for the drawShape tool (free-form
 * sketch converted into a recognized excalidraw element). Pointer events
 * are piped here from App.
 *
 * The gesture is committed by `finalize()` — recognize → (maybe upgrade
 * line to arrow) → insert → bind endpoints — which is invoked from within
 * `actionFinalize`, the editor's single finalization funnel. Whatever
 * triggers a finalize (the gesture's own pointerup, a mid-gesture paste
 * switching tools, …), the pending sketch resolves there exactly once.
 */
export declare class AppDrawShape {
    private app;
    trail: DrawShapeTrail;
    /** a pointerdown started a sketch that `finalize()` hasn't resolved yet */
    private gestureInProgress;
    constructor(app: App);
    stop: () => void;
    hasPendingGesture: () => boolean;
    handlePointerDown: (pointerDownState: PointerDownState) => void;
    /** returns true when the pointermove was consumed by the shape preview */
    handlePointerMove: (pointerCoords: {
        x: number;
        y: number;
    }) => boolean;
    /**
     * Binds both endpoints of a freshly inserted drawShape arrow to the
     * bindable elements they hover, if any.
     *
     * Endpoints bind in "orbit" mode — the arrow starts/ends at the target's
     * outline — even when the stroke was started or released inside the shape
     * (a sketched connector aims at the shape, not at a point inside it). The
     * exception is a sketch contained in a single shape: both ends then bind
     * "inside" and stay where they were drawn, like the interactive
     * inside→inside flow.
     */
    private bindRecognizedArrow;
    /**
     * A sketched line that connects a bindable element with something else —
     * another element or blank canvas — was meant as a connector: upgrade it
     * to an arrow (called before insertion). A line touching no shape, or
     * contained in a single shape (an annotation, not a connector), stays a
     * line.
     */
    private maybeUpgradeLineToArrow;
    /**
     * Commits the pending sketch, if any, and clears the trail. Invoked from
     * within `actionFinalize` — never call directly, execute `actionFinalize`
     * instead so element insertion flows into the action's returned elements.
     */
    finalize: () => void;
}
