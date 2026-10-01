import type { ExcalidrawElement, Ordered, OrderedExcalidrawElement, SceneElementsMap } from "./types";
import type { DTO, ValueOf } from "../../common/src/utility-types";
import type { AppState, ObservedAppState } from "../../excalidraw/types";
import { StoreSnapshot } from "./store";
/**
 * Represents the difference between two objects of the same type.
 *
 * Both `deleted` and `inserted` partials represent the same set of added, removed or updated properties, where:
 * - `deleted` is a set of all the deleted values
 * - `inserted` is a set of all the inserted (added, updated) values
 *
 * Keeping it as pure object (without transient state, side-effects, etc.), so we won't have to instantiate it on load.
 */
export declare class Delta<T> {
    readonly deleted: Partial<T>;
    readonly inserted: Partial<T>;
    private constructor();
    static create<T>(deleted: Partial<T>, inserted: Partial<T>, modifier?: (delta: Partial<T>, partialType: "deleted" | "inserted") => Partial<T>, modifierOptions?: "deleted" | "inserted" | "both"): Delta<T>;
    /**
     * Calculates the delta between two objects.
     *
     * @param prevObject - The previous state of the object.
     * @param nextObject - The next state of the object.
     *
     * @returns new delta instance.
     */
    static calculate<T extends {
        [key: string]: any;
    }>(prevObject: T, nextObject: T, modifier?: (partial: Partial<T>) => Partial<T>, postProcess?: (deleted: Partial<T>, inserted: Partial<T>) => [Partial<T>, Partial<T>]): Delta<T>;
    static empty(): Delta<unknown>;
    static isEmpty<T>(delta: Delta<T>): boolean;
    /**
     * Merges two deltas into a new one.
     */
    static merge<T>(delta1: Delta<T>, delta2: Delta<T>, delta3?: Delta<T>): Delta<T>;
    /**
     * Merges deleted and inserted object partials.
     */
    static mergeObjects<T extends {
        [key: string]: unknown;
    }>(prev: T, added: T, removed?: T): T;
    /**
     * Merges deleted and inserted array partials.
     */
    static mergeArrays<T>(prev: readonly T[] | null, added: readonly T[] | null | undefined, removed: readonly T[] | null | undefined, predicate?: (value: T) => string): T[];
    /**
     * Diff object partials as part of the `postProcess`.
     */
    static diffObjects<T, K extends keyof T, V extends ValueOf<T[K]>>(deleted: Partial<T>, inserted: Partial<T>, property: K, setValue: (prevValue: V | undefined) => V): void;
    /**
     * Diff array partials as part of the `postProcess`.
     */
    static diffArrays<T, K extends keyof T, V extends T[K]>(deleted: Partial<T>, inserted: Partial<T>, property: K, groupBy: (value: V extends ArrayLike<infer T> ? T : never) => string): void;
    /**
     * Compares if object1 contains any different value compared to the object2.
     */
    static isLeftDifferent<T extends {}>(object1: T, object2: T, skipShallowCompare?: boolean): boolean;
    /**
     * Compares if object2 contains any different value compared to the object1.
     */
    static isRightDifferent<T extends {}>(object1: T, object2: T, skipShallowCompare?: boolean): boolean;
    /**
     * Compares if shared properties of object1 and object2 contain any different value (aka inner join).
     */
    static isInnerDifferent<T extends {}>(object1: T, object2: T, skipShallowCompare?: boolean): boolean;
    /**
     * Compares if any properties of object1 and object2 contain any different value (aka full join).
     */
    static isDifferent<T extends {}>(object1: T, object2: T, skipShallowCompare?: boolean): boolean;
    /**
     * Returns sorted object1 keys that have distinct values.
     */
    static getLeftDifferences<T extends {}>(object1: T, object2: T, skipShallowCompare?: boolean): string[];
    /**
     * Returns sorted object2 keys that have distinct values.
     */
    static getRightDifferences<T extends {}>(object1: T, object2: T, skipShallowCompare?: boolean): string[];
    /**
     * Returns sorted keys of shared object1 and object2 properties that have distinct values (aka inner join).
     */
    static getInnerDifferences<T extends {}>(object1: T, object2: T, skipShallowCompare?: boolean): string[];
    /**
     * Returns sorted keys that have distinct values between object1 and object2 (aka full join).
     */
    static getDifferences<T extends {}>(object1: T, object2: T, skipShallowCompare?: boolean): string[];
    /**
     * Iterator comparing values of object properties based on the passed joining strategy.
     *
     * @yields keys of properties with different values
     *
     * WARN: it's based on shallow compare performed only on the first level and doesn't go deeper than that.
     */
    private static distinctKeysIterator;
}
/**
 * Encapsulates a set of application-level `Delta`s.
 */
export interface DeltaContainer<T> {
    /**
     * Inverses the `Delta`s while creating a new `DeltaContainer` instance.
     */
    inverse(): DeltaContainer<T>;
    /**
     * Applies the `Delta`s to the previous object.
     *
     * @returns a tuple of the next object `T` with applied `Delta`s, and `boolean`, indicating whether the applied deltas resulted in a visible change.
     */
    applyTo(previous: T, ...options: unknown[]): [T, boolean];
    /**
     * Squashes the current delta with the given one.
     */
    squash(delta: DeltaContainer<T>): this;
    /**
     * Checks whether all `Delta`s are empty.
     */
    isEmpty(): boolean;
}
export declare class AppStateDelta implements DeltaContainer<AppState> {
    delta: Delta<ObservedAppState>;
    private constructor();
    static create(delta: Delta<ObservedAppState>): AppStateDelta;
    static calculate<T extends ObservedAppState>(prevAppState: T, nextAppState: T): AppStateDelta;
    static restore(appStateDeltaDTO: DTO<AppStateDelta>): AppStateDelta;
    static empty(): AppStateDelta;
    inverse(): AppStateDelta;
    squash(delta: AppStateDelta): this;
    applyTo(appState: AppState, nextElements: SceneElementsMap): [AppState, boolean];
    isEmpty(): boolean;
    /**
     * Mutates `nextAppState` be filtering out state related to deleted elements.
     *
     * @returns `true` if a visible change is found, `false` otherwise.
     */
    private filterInvisibleChanges;
    private static filterSelectedElements;
    private static filterSelectedGroups;
    private static stripElementsProps;
    private static stripStandaloneProps;
    /**
     * It is necessary to post process the partials in case of reference values,
     * for which we need to calculate the real diff between `deleted` and `inserted`.
     */
    private static postProcess;
    private static orderAppStateKeys;
}
type ElementPartial<TElement extends ExcalidrawElement = ExcalidrawElement> = Omit<Partial<Ordered<TElement>>, "id" | "updated" | "seed">;
export type ApplyToOptions = {
    excludedProperties?: Set<keyof ElementPartial>;
};
/**
 * Elements change is a low level primitive to capture a change between two sets of elements.
 * It does so by encapsulating forward and backward `Delta`s, allowing to time-travel in both directions.
 */
export declare class ElementsDelta implements DeltaContainer<SceneElementsMap> {
    readonly added: Record<string, Delta<ElementPartial>>;
    readonly removed: Record<string, Delta<ElementPartial>>;
    readonly updated: Record<string, Delta<ElementPartial>>;
    private constructor();
    static create(added: Record<string, Delta<ElementPartial>>, removed: Record<string, Delta<ElementPartial>>, updated: Record<string, Delta<ElementPartial>>, options?: {
        shouldRedistribute: boolean;
    }): ElementsDelta;
    static restore(elementsDeltaDTO: DTO<ElementsDelta>): ElementsDelta;
    private static satisfiesAddition;
    private static satisfiesRemoval;
    private static satisfiesUpdate;
    private static satisfiesCommmonInvariants;
    private static satisfiesUniqueInvariants;
    private static validate;
    /**
     * Calculates the `Delta`s between the previous and next set of elements.
     *
     * @param prevElements - Map representing the previous state of elements.
     * @param nextElements - Map representing the next state of elements.
     *
     * @returns `ElementsDelta` instance representing the `Delta` changes between the two sets of elements.
     */
    static calculate<T extends OrderedExcalidrawElement>(prevElements: Map<string, T>, nextElements: Map<string, T>): ElementsDelta;
    static empty(): ElementsDelta;
    inverse(): ElementsDelta;
    isEmpty(): boolean;
    /**
     * Update delta/s based on the existing elements.
     *
     * @param nextElements current elements
     * @param modifierOptions defines which of the delta (`deleted` or `inserted`) will be updated
     * @returns new instance with modified delta/s
     */
    applyLatestChanges(prevElements: SceneElementsMap, nextElements: SceneElementsMap, modifierOptions?: "deleted" | "inserted"): ElementsDelta;
    applyTo(elements: SceneElementsMap, snapshot?: StoreSnapshot["elements"], options?: ApplyToOptions): [SceneElementsMap, boolean];
    squash(delta: ElementsDelta): this;
    private static createApplier;
    private static createGetter;
    private static applyDelta;
    /**
     * Whether an element looks different after the delta — and the layout that
     * followed it — was applied. The input to history's "skip entries with no
     * visible change" loop.
     *
     * Both sides are first reduced to what actually paints:
     * - a missing or deleted element paints nothing;
     * - an empty text element paints nothing either — unless it carries arrow
     *   bindings (an arrow may end at it) or sits on an arrow (an empty label
     *   still cuts the arrow's gap);
     * so an empty label's deletion or restoration compares as nothing against
     * nothing. Two painting elements are then compared property by property:
     * - `version`, `versionNonce`, `updated`, `created` are metadata, and
     *   `index` is covered by the separate z-order check (`reorderElements`);
     * - `boundElements` is compared as `type:id` references with references to
     *   empty labels dropped, so adding or removing an empty label's reference
     *   is not visible on its own, and binding repair that rebuilt equal
     *   objects is not either;
     * - everything else counts. Nested arrays (`points`, binding fixed points)
     *   compare by reference, which can only over-report a change — the safe
     *   direction, where undo stops one entry early.
     *
     * `previousElements` holds only `idsToCheck` (see `applyTo`); the label
     * lookups it serves are for elements whose labels are in that set.
     */
    private static checkForVisibleDifference;
    /**
     * Resolves conflicts for all previously added, removed and updated elements.
     * Updates the previous deltas with all the changes after conflict resolution.
     *
     * // TODO: revisit since some bound arrows seem to be often redrawn incorrectly
     *
     * @returns all elements affected by the conflict resolution
     */
    private resolveConflicts;
    /**
     * Non deleted affected elements of removed elements (before and after applying delta),
     * should be unbound ~ bindings should not point from non deleted into the deleted element/s.
     */
    private static unbindAffected;
    /**
     * Non deleted affected elements of added or updated element/s (before and after applying delta),
     * should be rebound (if possible) with the current element ~ bindings should be bidirectional.
     */
    private static rebindAffected;
    static redrawElements(nextElements: SceneElementsMap, changedElements: Map<string, OrderedExcalidrawElement>): SceneElementsMap;
    private static redrawTextBoundingBoxes;
    private static redrawBoundArrows;
    private static reorderElements;
    /**
     * It is necessary to post process the partials in case of reference values,
     * for which we need to calculate the real diff between `deleted` and `inserted`.
     */
    private static postProcess;
    private static stripIrrelevantProps;
}
export {};
