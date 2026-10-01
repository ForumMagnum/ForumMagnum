import type { ExcalidrawNonSelectionElement, NonDeleted } from "../../element/src/types";
import type App from "./App";
import type { ToolType } from "../types";
type ScenePoint = {
    x: number;
    y: number;
};
/** what a drag places: any element the new-element canvas can preview */
type DraggedElement = NonDeleted<ExcalidrawNonSelectionElement>;
/**
 * A tool the user can drag out of the toolbar to drop a default-sized element
 * where the pointer is released.
 */
type DraggableTool = {
    /** the element the drop creates, centered on the pointer */
    createElement: (app: App, center: ScenePoint) => DraggedElement;
    /** what the tool does once its element is on the canvas (e.g. start editing) */
    onDrop?: (app: App, element: DraggedElement) => void;
};
/**
 * The tools that can be dragged out of the toolbar. Add an entry to make a
 * tool's button draggable — the gesture, preview and drop are shared.
 */
export declare const DRAGGABLE_TOOLS: Partial<Record<ToolType, DraggableTool>>;
/** CSS opacity of the preview canvas while dragging */
export declare const TOOL_DRAG_PREVIEW_OPACITY = 0.5;
/**
 * Dragging a tool out of the toolbar. The preview element exists only here
 * until the drop — it is not in the scene, the store or the history, so
 * collaborators never see it and an aborted drag leaves nothing behind. It
 * is painted by the `NewElementCanvas`, drawn exactly as it will land, with
 * the canvas itself made translucent.
 *
 * The button arms on pointerdown; the drag starts once the pointer has
 * moved `DRAGGING_THRESHOLD`, so a plain click still selects the tool. The
 * gesture lives on the owner window (the pointer leaves the button at once),
 * like the other pointer gestures in `App`.
 */
export declare class AppToolDrag {
    private app;
    constructor(app: App);
    /** the element under the pointer while dragging, `null` otherwise */
    preview: DraggedElement | null;
    private armed;
    private tool;
    private type;
    static isDraggable: (type: ToolType) => boolean;
    isDragging: () => boolean;
    /**
     * Arm a drag from a tool button's pointerdown. Returns whether the tool is
     * draggable (the caller lets a non-draggable press fall through).
     */
    handleButtonPointerDown: (type: ToolType, event: PointerEvent) => boolean;
    private onPointerMove;
    private onPointerUp;
    private onKeyDown;
    /** drop the gesture without a trace */
    cancel: () => void;
    private isOverCanvas;
    private addListeners;
    private removeListeners;
}
export {};
