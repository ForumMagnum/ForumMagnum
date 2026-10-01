import type React from "react";
import type App from "./App";
/**
 * The drag-pan: a pointer drag that moves the canvas — the wheel or the
 * secondary button, the main button while space is held or the hand tool
 * is active, or any button in view mode. One session at a time, owning its
 * window listeners and teardown; wheel input is gated on it (see
 * `AppWheel`).
 *
 * A secondary-button session is a pan only once the pointer travels past
 * the drag threshold; released before that, it is a right-click. The
 * platform's `contextmenu` event opens the menu for a right-click where it
 * follows the release (Windows), as it always has; where it comes with the
 * press (macOS, Linux) it is swallowed — a drag cannot be told from a
 * click yet — and the session opens the menu on release instead.
 */
export declare class AppPan {
    private app;
    private dependencies;
    /** space held down turns a main-button drag into a pan */
    private spaceHeld;
    private active;
    /** the secondary-button session, while one is active */
    private secondary;
    /** the platform fires `contextmenu` on mouseup (Windows) or on mousedown
     * (macOS, Linux); the one belonging to a secondary-button session is not a
     * new click, whichever side of the session it lands on */
    private suppressNextContextMenu;
    /** applies the pointer move the session is holding back for its next
     * frame, if any */
    private pendingMoveFlush;
    private teardown;
    constructor(app: App, dependencies: {
        /** pointers currently down (a two-finger gesture is not a pan) */
        getPointerCount: () => number;
        /** a scrollbar being dragged (App's own drag, not a pan session) */
        isDraggingScrollBar: () => boolean;
    });
    isActive: () => boolean;
    isSpaceHeld: () => boolean;
    setSpaceHeld: (held: boolean) => void;
    /**
     * Whether the pointer is navigating the viewport rather than acting on the
     * scene — space held to pan, a pan in progress, a scrollbar drag, or the
     * hand tool. Hover and cursor then belong to the navigation.
     */
    isNavigating: () => boolean;
    /** applies the pointer move still waiting for its frame, if any */
    flushMove: () => void;
    /** ends the active session, if any — pointerup may never arrive (the user
     * tabs away, a new pointerdown lands first) */
    end: () => void;
    /**
     * Whether a `contextmenu` event belongs to a secondary-button session and
     * must not open the menu: it came with the press (the session decides on
     * release), or it follows a release that turned out to be a drag.
     */
    consumesContextMenuEvent: () => boolean;
    /** starts a session for the pointerdown if it qualifies; returns whether
     * it did */
    start: (event: React.PointerEvent<HTMLElement> | MouseEvent) => boolean;
}
