import "./CursorHint.scss";
import type { AppClassProperties, AppState } from "../types";
/**
 * While a recently shown hint is still fresh in memory, tool-switch hints
 * are suppressed (repeatedly re-picking a tool you just used doesn't need
 * the reminder). Cycling arrow types and numeric shortcuts bypass this.
 */
export declare const CURSOR_HINT_COOLDOWN: number;
export declare const cursorHintAtom: import("jotai").PrimitiveAtom<{
    content: React.ReactNode;
    /** unique per trigger so a re-trigger restarts the hide timer */
    nonce: number;
} | null> & {
    init: {
        content: React.ReactNode;
        /** unique per trigger so a re-trigger restarts the hide timer */
        nonce: number;
    } | null;
};
/**
 * Owns the cursor-hint policy. App reports semantic interaction events
 * (what the user did); all decisions about whether and what to show —
 * cooldown, bypasses, hint content — are made here.
 */
export declare class CursorHints {
    private app;
    private lastShownAt;
    constructor(app: AppClassProperties);
    /**
     * Shows a transient tooltip next to the cursor, hidden automatically
     * after a short delay. Repeated calls replace the content and restart
     * the timer.
     */
    show: (content: React.ReactNode) => void;
    private isOnCooldown;
    /** arrow type cycled via shortcut (arrow tool already active) */
    onArrowTypeCycled: (arrowType: AppState["currentItemArrowType"]) => void;
    /** arrow/line tool picked via keyboard shortcut */
    onToolShortcut: (tool: "arrow" | "line", source: "letter" | "digit") => void;
}
/**
 * Transient tooltip shown next to the cursor for added affordance after
 * actions that have no other visual feedback near the pointer (e.g. cycling
 * arrow types via shortcut). Trigger via `app.cursorHints`.
 */
export declare const CursorHint: () => import("react/jsx-runtime").JSX.Element | null;
