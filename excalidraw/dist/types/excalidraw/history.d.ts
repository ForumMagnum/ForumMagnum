import { Emitter } from "../common/src/index";
import { StoreDelta } from "../element/src/index";
import type { StoreSnapshot, Store } from "../element/src/index";
import type { SceneElementsMap } from "../element/src/types";
import type { AppState } from "./types";
export declare class HistoryDelta extends StoreDelta {
    /**
     * Apply the delta to the passed elements and appState, does not modify the snapshot.
     */
    applyTo(elements: SceneElementsMap, appState: AppState, snapshot: StoreSnapshot): [SceneElementsMap, AppState, boolean];
    /**
     * Overriding once to avoid type casting everywhere.
     */
    static calculate(prevSnapshot: StoreSnapshot, nextSnapshot: StoreSnapshot): HistoryDelta;
    /**
     * Overriding once to avoid type casting everywhere.
     */
    static inverse(delta: StoreDelta): HistoryDelta;
    /**
     * Overriding once to avoid type casting everywhere.
     */
    static applyLatestChanges(delta: StoreDelta, prevElements: SceneElementsMap, nextElements: SceneElementsMap, modifierOptions?: "deleted" | "inserted"): HistoryDelta;
}
export declare class HistoryChangedEvent {
    readonly isUndoStackEmpty: boolean;
    readonly isRedoStackEmpty: boolean;
    constructor(isUndoStackEmpty?: boolean, isRedoStackEmpty?: boolean);
}
export declare class History {
    private readonly store;
    readonly onHistoryChangedEmitter: Emitter<[HistoryChangedEvent]>;
    readonly undoStack: HistoryDelta[];
    readonly redoStack: HistoryDelta[];
    get isUndoStackEmpty(): boolean;
    get isRedoStackEmpty(): boolean;
    constructor(store: Store);
    clear(): void;
    /**
     * Record a non-empty local durable increment, which will go into the undo stack..
     * Do not re-record history entries, which were already pushed to undo / redo stack, as part of history action.
     */
    record(delta: StoreDelta): void;
    undo(elements: SceneElementsMap, appState: AppState): void | [SceneElementsMap, AppState];
    redo(elements: SceneElementsMap, appState: AppState): void | [SceneElementsMap, AppState];
    private perform;
    private static pop;
    private static push;
}
