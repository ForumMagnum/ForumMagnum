import type { AppState } from "../types";
import type App from "./App";
/**
 * Captures all cursor management for the interactive canvas.
 *
 * The canvas cursor is set exclusively imperatively, through this class —
 * never via inline styles or React-rendered `style.cursor`, which React
 * would rewrite on rerender whenever the computed value changes, clobbering
 * cursors set here.
 */
export declare class AppCursor {
    private app;
    private toolCursorMemo;
    private eraserCanvasCache;
    private eraserPreviewDataURL;
    constructor(app: App);
    private get canvas();
    set: (cursor: string) => void;
    /**
     * Resets to the resting cursor — the cursor shown when no interaction or
     * hover affordance overrides it: the view-mode grab cursor when
     * drag-to-pan applies, the active tool's cursor otherwise.
     */
    reset: () => void;
    /** applies the given tool's cursor (defaults to the active tool) */
    applyForTool: (activeTool?: AppState["activeTool"]) => void;
    /**
     * Re-runs the hover cursor logic at the last known pointer position by
     * re-dispatching a synthetic pointermove — for state changes that alter
     * what hovering means without the pointer moving (e.g. the tool reverting
     * to selection after an element is created). Mouse only: touch and pen
     * have no resting hover to restore.
     */
    refreshHover: () => void;
    /** clears the inline cursor so the environment default (CSS) applies */
    private clear;
    private applyEraser;
}
