import type { Theme } from "../../element/src/types";
import type App from "./App";
type ScenePoint = {
    x: number;
    y: number;
};
/** Owns bucket-fill interaction and App-bound scene mutations. */
export declare class AppBucketFill {
    private app;
    constructor(app: App);
    private temporaryEyeDropper;
    /**
     * The click armed on pointer down, committed on pointer up. Deferring the
     * scene mutation to pointer up is what lets a pinch/pan second finger, a
     * long-press context menu, or a pointercancel abort the fill — on pointer
     * down the editor cannot yet know the gesture will stay a single-pointer
     * click.
     */
    private pending;
    /** Arm a fill at the pointer-down position; nothing mutates yet. */
    handlePointerDown: (scenePointer: ScenePoint) => void;
    /**
     * Commit the armed fill, at the pointer-DOWN position (what the user
     * aimed at). No-op when the gesture was aborted in the meantime.
     */
    handlePointerUp: () => void;
    /** Abort the armed fill (second finger, context menu, pointercancel). */
    cancel: () => void;
    cycleBackgroundColor: () => void;
    openTemporaryEyeDropper: () => void;
    closeTemporaryEyeDropper: () => void;
    /**
     * Apply the current bucket fill settings to an existing fill-compatible
     * element (no-op when nothing would change). One undoable step.
     */
    private restyle;
    private fill;
    /**
     * The color the bucket fill tool actually fills with: the shared
     * `currentItemBackgroundColor`, falling back to green when that is
     * transparent (the tool's picker doesn't offer transparent, but the shared
     * state can hold it from the generic shape picker).
     */
    getBucketFillBackgroundColor: (backgroundColor: string, 
    /** supply only for display purposes such as when applying to the cursor */
    theme?: Theme) => string;
}
export {};
