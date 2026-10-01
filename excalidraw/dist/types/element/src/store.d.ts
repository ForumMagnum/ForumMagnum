import { Emitter } from "../../common/src/index";
import type App from "../../excalidraw/components/App";
import type { DTO, ValueOf } from "../../common/src/utility-types";
import type { AppState, ObservedAppState } from "../../excalidraw/types";
import { ElementsDelta, AppStateDelta } from "./delta";
import type { ApplyToOptions } from "./delta";
import type { ExcalidrawElement, OrderedExcalidrawElement, SceneElementsMap } from "./types";
export declare const CaptureUpdateAction: {
    /**
     * Immediately undoable.
     *
     * Use for updates which should be captured.
     * Should be used for most of the local updates, except ephemerals such as dragging or resizing.
     *
     * These updates will _immediately_ make it to the local undo / redo stacks.
     */
    readonly IMMEDIATELY: "IMMEDIATELY";
    /**
     * Never undoable.
     *
     * Use for updates which should never be recorded, such as remote updates
     * or scene initialization.
     *
     * These updates will _never_ make it to the local undo / redo stacks.
     */
    readonly NEVER: "NEVER";
    /**
     * Eventually undoable.
     *
     * Use for updates which should not be captured immediately - likely
     * exceptions which are part of some async multi-step process. Otherwise, all
     * such updates would end up being captured with the next
     * `CaptureUpdateAction.IMMEDIATELY` - triggered either by the next `updateScene`
     * or internally by the editor.
     *
     * These updates will _eventually_ make it to the local undo / redo stacks.
     */
    readonly EVENTUALLY: "EVENTUALLY";
};
export type CaptureUpdateActionType = ValueOf<typeof CaptureUpdateAction>;
/**
 * Store which captures the observed changes and emits them as `StoreIncrement` events.
 */
export declare class Store {
    private readonly app;
    readonly onDurableIncrementEmitter: Emitter<[DurableIncrement]>;
    readonly onStoreIncrementEmitter: Emitter<[DurableIncrement | EphemeralIncrement]>;
    private scheduledMacroActions;
    private scheduledMicroActions;
    private _snapshot;
    get snapshot(): StoreSnapshot;
    set snapshot(snapshot: StoreSnapshot);
    constructor(app: App);
    scheduleAction(action: CaptureUpdateActionType): void;
    /**
     * Use to schedule a delta calculation, which will consquentially be emitted as `DurableStoreIncrement` and pushed in the undo stack.
     */
    scheduleCapture(): void;
    /**
     * Schedule special "micro" actions, to-be executed before the next commit, before it executes a scheduled "macro" action.
     */
    scheduleMicroAction(params: {
        action: CaptureUpdateActionType;
        elements: readonly ExcalidrawElement[] | undefined;
        appState: AppState | ObservedAppState | undefined;
    } | {
        action: typeof CaptureUpdateAction.IMMEDIATELY;
        change: StoreChange;
        delta: StoreDelta;
    } | {
        action: typeof CaptureUpdateAction.NEVER | typeof CaptureUpdateAction.EVENTUALLY;
        change: StoreChange;
    }): void;
    /**
     * Performs the incoming `CaptureUpdateAction` and emits the corresponding `StoreIncrement`.
     * Emits `DurableStoreIncrement` when action is "capture", emits `EphemeralStoreIncrement` otherwise.
     *
     * @emits StoreIncrement
     */
    commit(elements: SceneElementsMap | undefined, appState: AppState | ObservedAppState | undefined): void;
    /**
     * Clears the store instance.
     */
    clear(): void;
    /**
     * Performs delta & change calculation and emits a durable increment.
     *
     * @emits StoreIncrement.
     */
    private emitDurableIncrement;
    /**
     * Performs change calculation and emits an ephemeral increment.
     *
     * @emits EphemeralStoreIncrement
     */
    private emitEphemeralIncrement;
    private applyChangeToSnapshot;
    /**
     * Clones the snapshot if there are changes detected.
     */
    private maybeCloneSnapshot;
    private flushMicroActions;
    private processAction;
    /**
     * Returns the scheduled macro action.
     */
    private getScheduledMacroAction;
    /**
     * Ensures that the scheduled actions invariant is satisfied.
     */
    private satisfiesScheduledActionsInvariant;
}
/**
 * Repsents a change to the store containing changed elements and appState.
 */
export declare class StoreChange {
    readonly elements: Record<string, OrderedExcalidrawElement>;
    readonly appState: Partial<ObservedAppState>;
    private constructor();
    static create(prevSnapshot: StoreSnapshot, nextSnapshot: StoreSnapshot): StoreChange;
}
/**
 * Encpasulates any change to the store (durable or ephemeral).
 */
export declare abstract class StoreIncrement {
    readonly type: "durable" | "ephemeral";
    readonly change: StoreChange;
    protected constructor(type: "durable" | "ephemeral", change: StoreChange);
    static isDurable(increment: StoreIncrement): increment is DurableIncrement;
    static isEphemeral(increment: StoreIncrement): increment is EphemeralIncrement;
}
/**
 * Represents a durable change to the store.
 */
export declare class DurableIncrement extends StoreIncrement {
    readonly change: StoreChange;
    readonly delta: StoreDelta;
    constructor(change: StoreChange, delta: StoreDelta);
}
/**
 * Represents an ephemeral change to the store.
 */
export declare class EphemeralIncrement extends StoreIncrement {
    readonly change: StoreChange;
    constructor(change: StoreChange);
}
/**
 * Represents a captured delta by the Store.
 */
export declare class StoreDelta {
    readonly id: string;
    readonly elements: ElementsDelta;
    readonly appState: AppStateDelta;
    protected constructor(id: string, elements: ElementsDelta, appState: AppStateDelta);
    /**
     * Create a new instance of `StoreDelta`.
     */
    static create(elements: ElementsDelta, appState: AppStateDelta, opts?: {
        id: string;
    }): StoreDelta;
    /**
     * Calculate the delta between the previous and next snapshot.
     */
    static calculate(prevSnapshot: StoreSnapshot, nextSnapshot: StoreSnapshot): StoreDelta;
    /**
     * Restore a store delta instance from a DTO.
     */
    static restore(storeDeltaDTO: DTO<StoreDelta>): StoreDelta;
    /**
     * Parse and load the delta from the remote payload.
     */
    static load({ id, elements: { added, removed, updated }, appState: { delta: appStateDelta }, }: DTO<StoreDelta>): StoreDelta;
    /**
     * Squash the passed deltas into the aggregated delta instance.
     */
    static squash(...deltas: StoreDelta[]): StoreDelta;
    /**
     * Inverse store delta, creates new instance of `StoreDelta`.
     */
    static inverse(delta: StoreDelta): StoreDelta;
    /**
     * Apply the delta to the passed elements and appState, does not modify the snapshot.
     */
    static applyTo(delta: StoreDelta, elements: SceneElementsMap, appState: AppState, options?: ApplyToOptions): [SceneElementsMap, AppState, boolean];
    /**
     * Apply latest (remote) changes to the delta, creates new instance of `StoreDelta`.
     */
    static applyLatestChanges(delta: StoreDelta, prevElements: SceneElementsMap, nextElements: SceneElementsMap, modifierOptions?: "deleted" | "inserted"): StoreDelta;
    static empty(): StoreDelta;
    isEmpty(): boolean;
}
/**
 * Represents a snapshot of the captured or updated changes in the store,
 * used for producing deltas and emitting `DurableStoreIncrement`s.
 */
export declare class StoreSnapshot {
    readonly elements: SceneElementsMap;
    readonly appState: ObservedAppState;
    readonly metadata: {
        didElementsChange: boolean;
        didAppStateChange: boolean;
        isEmpty?: boolean;
    };
    private _lastChangedElementsHash;
    private _lastChangedAppStateHash;
    private constructor();
    static create(elements: SceneElementsMap, appState: AppState | ObservedAppState, metadata?: {
        didElementsChange: boolean;
        didAppStateChange: boolean;
    }): StoreSnapshot;
    static empty(): StoreSnapshot;
    getChangedElements(prevSnapshot: StoreSnapshot): Record<string, OrderedExcalidrawElement>;
    getChangedAppState(prevSnapshot: StoreSnapshot): Partial<ObservedAppState>;
    isEmpty(): boolean | undefined;
    /**
     * Apply the change and return a new snapshot instance.
     */
    applyChange(change: StoreChange): StoreSnapshot;
    /**
     * Efficiently clone the existing snapshot, only if we detected changes.
     *
     * @returns same instance if there are no changes detected, new instance otherwise.
     */
    maybeClone(action: CaptureUpdateActionType, elements: SceneElementsMap | undefined, appState: AppState | ObservedAppState | undefined): StoreSnapshot;
    private maybeCreateAppStateSnapshot;
    private maybeCreateElementsSnapshot;
    private detectChangedAppState;
    /**
     * Detect if there are any changed elements.
     */
    private detectChangedElements;
    /**
     * Perform structural clone, deep cloning only elements that changed.
     */
    private createElementsSnapshot;
}
export declare const getObservedAppState: (appState: AppState | ObservedAppState) => ObservedAppState;
