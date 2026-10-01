import { type StylesPanelMode } from "../../common/src/index";
import type { NonDeletedSceneElementsMap } from "../../element/src/types";
import { type SetViewportOptions } from "../viewport";
import type { AppProps, AppState, Offsets, ScrollConstraints, ViewportOffsets, ViewportOffsetsOptions, ViewportUIName } from "../types";
import type App from "./App";
export declare const SCROLL_TO_CONTENT_ANIMATION_KEY = "animateScrollToContent";
export declare const SCROLL_CONSTRAINTS_SNAP_BACK_ANIMATION_KEY = "animateScrollConstraintsSnapBack";
/** single source of truth for the `--right-sidebar-width` CSS variable */
export declare const RIGHT_SIDEBAR_WIDTH = 302;
type Viewport = Pick<AppState, "scrollX" | "scrollY" | "zoom">;
type AppViewportDependencies = {
    getContainer: () => HTMLDivElement | null;
    getStylesPanelMode: () => StylesPanelMode;
    isGestureActive: () => boolean;
};
/**
 * Rubberband snap-back: animates the viewport from its current (possibly
 * overscrolled) position back inside the lock box via the shared
 * AnimationController. No-op when already within the hard bounds (or when
 * there is no lock).
 */
export declare const snapBackToConstraints: (state: Pick<AppState, "scrollX" | "scrollY" | "zoom" | "width" | "height" | "scrollConstraints">, onFrame: (updater: (state: Pick<AppState, "scrollX" | "scrollY" | "zoom" | "width" | "height" | "scrollConstraints">) => Viewport | null) => void, duration?: number) => void;
/**
 * Owns viewport state transitions and App-bound viewport concerns. Pure
 * viewport geometry remains in `viewport.ts` so actions and public helpers can
 * calculate state without an App instance.
 */
export declare class AppViewport {
    private app;
    private dependencies;
    lastPosition: {
        x: number;
        y: number;
    };
    private activeTransition;
    private uiLastMeasured;
    constructor(app: App, dependencies: AppViewportDependencies);
    get isAnimating(): boolean;
    /** Whether a programmatic transition into a locked viewport currently owns
     * user pan/zoom input. */
    get isLockedTransitionPending(): boolean;
    invalidateUIOffset: (name: ViewportUIName) => void;
    /**
     * The side a rendered side UI (`data-viewport-ui="side"`) docks to, and
     * how far it reaches into the canvas from it, in screen px.
     */
    private measureSide;
    /**
     * The side a named surface docks to while it's hidden, and how far it
     * reaches into the canvas from it: as last measured, else approximately.
     */
    private getReservedSide;
    private querySideUI;
    /**
     * Where a rendered side UI is, relative to the editor's container, in
     * screen px; null when it isn't rendered.
     */
    getSideUIRect: (name: ViewportUIName) => {
        left: number;
        right: number;
        top: number;
        bottom: number;
    } | null;
    /**
     * How far the named side UIs reach into the canvas, in screen px, from
     * the left and the right: the part of the canvas they cover. Zero at a
     * side none of them is rendered at — e.g. with the sidebar closed, or on
     * phones, where it's an overlay that doesn't count as viewport UI — unless
     * a hidden one is reserved (see `ViewportOffsetsOptions.reserve`).
     */
    getSideInsets: (names: readonly ViewportUIName[], opts?: Pick<ViewportOffsetsOptions, "reserve">) => {
        left: number;
        right: number;
    };
    /** How far the sidebar reaches into the canvas (see `getSideInsets`). */
    getSidebarInsets: () => {
        left: number;
        right: number;
    };
    /**
     * Resolves user-supplied viewport offsets into concrete per-side pixel
     * values. Static sides take precedence over UI-derived sides.
     */
    resolveOffsets: (offsets: ViewportOffsets | undefined) => Offsets | undefined;
    /**
     * Measures the currently rendered editor UI and returns the usable viewport
     * offsets, including optional padding and reserved hidden surfaces.
     */
    getOffsets: (opts?: ViewportOffsetsOptions) => Offsets;
    /** Resolves the host-supplied initial viewport against restored scene data. */
    resolveInitialViewport: (opts: Omit<SetViewportOptions, "animation">, elementsMap: NonDeletedSceneElementsMap, appState: AppState) => (Viewport & {
        scrollConstraints: ScrollConstraints | null;
    }) | null;
    /**
     * Navigates to a target and optionally installs scroll/zoom constraints.
     * Navigating stops following a collaborator, as a user's pan does.
     */
    setViewport: (opts: SetViewportOptions | null) => void;
    /** Use when changing scrollX/scrollY/zoom based on user interaction. */
    translate: <K extends keyof AppState>(state: AppState | Pick<AppState, K> | null | ((prevState: Readonly<AppState>, props: Readonly<AppProps>) => AppState | Pick<AppState, K> | null), opts?: {
        zoomPreConstrained?: boolean;
        preserveScrollConstraintsSnapBack?: boolean;
    }) => boolean;
    /** Clamps the viewport into the active scroll constraints. */
    constrain: (overscroll?: number) => void;
    /** Releases a held rubberband overscroll. */
    releaseOverscroll: () => void;
    private snapBack;
    private snapBackDebounced;
    private cancelTransition;
    destroy: () => void;
}
export {};
