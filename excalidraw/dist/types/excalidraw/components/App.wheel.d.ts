import type App from "./App";
/**
 * Wheel input over the editor: pans the canvas, or zooms it around the
 * pointer (`viewport.lastPosition`) — on ctrl/cmd+wheel (which is also how
 * a trackpad pinch is delivered), while the wheel button itself is held
 * down, or on a plain wheel when the input device is a mouse
 * (`appState.inputDevice`). Shift+wheel pans horizontally;
 * ctrl/cmd+shift+wheel pans vertically.
 */
export declare class AppWheel {
    private app;
    constructor(app: App);
    /** the editor surfaces whose wheel input the editor consumes; everywhere
     * else (menus, sidebars, …) the DOM keeps scrolling. The frame-name labels
     * are DOM, but sit inside the container this listener is attached to */
    private isOverEditorSurface;
    handle: (event: WheelEvent) => void;
    /**
     * Prevents the browser's own zoom over the non-interactive editor while
     * letting regular scroll through (trackpad pinch is delivered as
     * ctrl+wheel).
     */
    preventBrowserZoom: (event: WheelEvent) => void;
    /** zooms around the pointer by a wheel delta (positive = zoom out) */
    private zoomBy;
}
