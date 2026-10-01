import type { GlobalCoord } from "../../math/src/index";
import type { FontFamilyValues, FontString } from "../../element/src/types";
import type { ActiveTool, AppState, ToolType, UnsubscribeCallback, Zoom } from "../../excalidraw/types";
import type { MaybePromise, ResolutionType } from "./utility-types";
import type { EVENT } from "./constants";
export declare const setDateTimeForTests: (dateTime: string) => void;
export declare const getDateTime: () => string;
export declare const capitalizeString: (str: string) => string;
export declare const isToolIcon: (target: Element | EventTarget | null) => target is HTMLElement;
export declare const isInputLike: (target: Element | EventTarget | null) => target is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLBRElement | HTMLDivElement;
export declare const isInteractive: (target: Element | EventTarget | null) => boolean;
export declare const isWritableElement: (target: Element | EventTarget | null) => target is HTMLInputElement | HTMLTextAreaElement | HTMLBRElement | HTMLDivElement;
export declare const getFontFamilyString: ({ fontFamily, }: {
    fontFamily: FontFamilyValues;
}) => string;
/** returns fontSize+fontFamily string for assignment to DOM elements */
export declare const getFontString: ({ fontSize, fontFamily, }: {
    fontSize: number;
    fontFamily: FontFamilyValues;
}) => FontString;
/** executes callback in the frame that's after the current one */
export declare const nextAnimationFrame: (cb: () => any) => Promise<void>;
export declare const debounce: <T extends any[]>(fn: (...args: T) => void, timeout: number) => {
    (...args: T): void;
    flush(): void;
    cancel(): void;
};
export declare const throttleRAF: <T extends any[]>(fn: (...args: T) => void) => {
    (...args: T): void;
    flush(): void;
    cancel(): void;
};
/**
 * Exponential ease-out method
 *
 * @param {number} k - The value to be tweened.
 * @returns {number} The tweened value.
 */
export declare const easeOut: (k: number) => number;
export declare const chunk: <T extends any>(array: readonly T[], size: number) => T[][];
export declare const selectNode: (node: Element) => void;
export declare const removeSelection: () => void;
export declare const distance: (x: number, y: number) => number;
export declare const isSelectionLikeTool: (type: ToolType | "custom") => type is "selection" | "lasso";
export declare const updateActiveTool: (appState: Pick<AppState, "activeTool">, data: (({
    type: ToolType;
} | {
    type: "custom";
    customType: string;
}) & {
    locked?: boolean;
    fromSelection?: boolean;
}) & {
    lastActiveTool?: ActiveTool | null;
}) => AppState["activeTool"];
export declare const isFullScreen: () => boolean;
export declare const allowFullScreen: () => Promise<void>;
export declare const exitFullScreen: () => Promise<void>;
export declare const viewportCoordsToSceneCoords: ({ clientX, clientY }: {
    clientX: number;
    clientY: number;
}, { zoom, offsetLeft, offsetTop, scrollX, scrollY, }: {
    zoom: Zoom;
    offsetLeft: number;
    offsetTop: number;
    scrollX: number;
    scrollY: number;
}) => GlobalCoord;
export declare const sceneCoordsToViewportCoords: ({ sceneX, sceneY }: {
    sceneX: number;
    sceneY: number;
}, { zoom, offsetLeft, offsetTop, scrollX, scrollY, }: {
    zoom: Zoom;
    offsetLeft: number;
    offsetTop: number;
    scrollX: number;
    scrollY: number;
}) => {
    x: number;
    y: number;
};
export declare const getGlobalCSSVariable: (name: string) => string;
/**
 * Checks whether first directional character is RTL. Meaning whether it starts
 *  with RTL characters, or indeterminate (numbers etc.) characters followed by
 *  RTL.
 * See https://github.com/excalidraw/excalidraw/pull/1722#discussion_r436340171
 */
export declare const isRTL: (text: string) => boolean;
/**
 * Checks whether the text has any RTL character, i.e. whether it may be laid
 * out bidirectionally.
 */
export declare const hasRTLChars: (text: string) => boolean;
export declare const tupleToCoors: (xyTuple: readonly [number, number]) => {
    x: number;
    y: number;
};
/** use as a rejectionHandler to mute filesystem Abort errors */
export declare const muteFSAbortError: (error?: Error) => void;
export declare const findIndex: <T>(array: readonly T[], cb: (element: T, index: number, array: readonly T[]) => boolean, fromIndex?: number) => number;
export declare const findLastIndex: <T>(array: readonly T[], cb: (element: T, index: number, array: readonly T[]) => boolean, fromIndex?: number) => number;
/** returns the first non-null mapped value */
export declare const mapFind: <T, K>(collection: readonly T[], iteratee: (value: T, index: number) => K | undefined | null) => K | undefined;
export type ResolvablePromise<T> = Promise<T> & {
    resolve: [T] extends [undefined] ? (value?: MaybePromise<Awaited<T>>) => void : (value: MaybePromise<Awaited<T>>) => void;
    reject: (error: Error) => void;
};
export declare const resolvablePromise: <T>() => ResolvablePromise<T>;
export declare const nFormatter: (num: number, digits: number) => string;
export declare const getVersion: () => string;
export declare const supportsEmoji: () => boolean;
export declare const getNearestScrollableContainer: (element: HTMLElement) => HTMLElement | Document;
export declare const focusNearestParent: (element: HTMLInputElement) => void;
export declare const preventUnload: (event: BeforeUnloadEvent) => void;
export declare const bytesToHexString: (bytes: Uint8Array) => string;
export declare const getUpdatedTimestamp: () => number;
/**
 * Transforms array of objects containing `id` attribute,
 * or array of ids (strings), into a Map, keyd by `id`.
 */
export declare const arrayToMap: <T extends {
    id: string;
} | string>(items: readonly T[] | Map<string, T>) => Map<string, T>;
export declare const arrayToMapWithIndex: <T extends {
    id: string;
}>(elements: readonly T[]) => Map<string, [element: T, index: number]>;
/**
 * Transform array into an object, use only when array order is irrelevant.
 */
export declare const arrayToObject: <T>(array: readonly T[], groupBy?: (value: T) => string | number) => {
    [key: string]: T;
};
/** Doubly linked node */
export type Node<T> = T & {
    prev: Node<T> | null;
    next: Node<T> | null;
};
/**
 * Creates a circular doubly linked list by adding `prev` and `next` props to the existing array nodes.
 */
export declare const arrayToList: <T>(array: readonly T[]) => Node<T>[];
/**
 * Converts a readonly array or map into an iterable.
 * Useful for avoiding entry allocations when iterating object / map on each iteration.
 */
export declare const toIterable: <T>(values: readonly T[] | ReadonlyMap<string, T>) => Iterable<T>;
/**
 * Converts a readonly array or map into an array.
 */
export declare const toArray: <T>(values: readonly T[] | ReadonlyMap<string, T>) => T[];
export declare const isTestEnv: () => boolean;
export declare const isDevEnv: () => boolean;
export declare const isProdEnv: () => boolean;
export declare const isServerEnv: () => boolean;
export declare const wrapEvent: <T extends Event>(name: EVENT, nativeEvent: T) => CustomEvent<{
    nativeEvent: T;
}>;
export declare const updateObject: <T extends Record<string, any>>(obj: T, updates: Partial<T>) => T;
export declare const isPrimitive: (val: any) => boolean;
export declare const getFrame: () => "top" | "iframe";
export declare const isRunningInIframe: () => boolean;
export declare const isPromiseLike: (value: any) => value is Promise<ResolutionType<typeof value>>;
export declare const queryFocusableElements: (container: HTMLElement | null) => HTMLElement[];
/**
 * Returns whether object/array is shallow equal.
 * Considers empty object/arrays as equal (whether top-level or second-level).
 */
export declare const isShallowEqual: <T extends Record<string, any>, K extends readonly unknown[]>(objA: T, objB: T, comparators?: { [key in keyof T]?: (a: T[key], b: T[key]) => boolean; } | (keyof T extends K[number] ? K extends readonly (keyof T)[] ? K : {
    _error: "keys are either missing or include keys not in compared obj";
} : {
    _error: "keys are either missing or include keys not in compared obj";
}), debug?: boolean) => boolean;
export declare const composeEventHandlers: <E>(originalEventHandler?: (event: E) => void, ourEventHandler?: (event: E) => void, { checkForDefaultPrevented }?: {
    checkForDefaultPrevented?: boolean | undefined;
}) => (event: E) => void;
/**
 * supply `null` as message if non-never value is valid, you just need to
 * typecheck against it
 */
export declare const assertNever: (value: never, message: string | null, softAssert?: boolean) => never;
export declare function invariant(condition: any, message: string): asserts condition;
/**
 * Memoizes on values of `opts` object (strict equality).
 */
export declare const memoize: <T extends Record<string, any>, R extends any>(func: (opts: T) => R) => typeof func & {
    clear: () => void;
};
/** Checks if value is inside given collection. Useful for type-safety. */
export declare const isMemberOf: <T extends string>(
/** Set/Map/Array/Object */
collection: Set<T> | readonly T[] | Record<T, any> | Map<T, any>, 
/** value to look for */
value: string) => value is T;
export declare const cloneJSON: <T>(obj: T) => T;
export declare const updateStable: <T extends any[] | Record<string, any>>(prevValue: T, nextValue: T) => T;
export declare function addEventListener<K extends keyof WindowEventMap>(target: Window & typeof globalThis, type: K, listener: (this: Window, ev: WindowEventMap[K]) => any, options?: boolean | AddEventListenerOptions): UnsubscribeCallback;
export declare function addEventListener(target: Window & typeof globalThis, type: string, listener: (this: Window, ev: Event) => any, options?: boolean | AddEventListenerOptions): UnsubscribeCallback;
export declare function addEventListener<K extends keyof DocumentEventMap>(target: Document, type: K, listener: (this: Document, ev: DocumentEventMap[K]) => any, options?: boolean | AddEventListenerOptions): UnsubscribeCallback;
export declare function addEventListener(target: Document, type: string, listener: (this: Document, ev: Event) => any, options?: boolean | AddEventListenerOptions): UnsubscribeCallback;
export declare function addEventListener<K extends keyof FontFaceSetEventMap>(target: FontFaceSet, type: K, listener: (this: FontFaceSet, ev: FontFaceSetEventMap[K]) => any, options?: boolean | AddEventListenerOptions): UnsubscribeCallback;
export declare function addEventListener<K extends keyof HTMLElementEventMap>(target: Document | (Window & typeof globalThis) | HTMLElement | undefined | null | false, type: K, listener: (this: HTMLDivElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): UnsubscribeCallback;
export declare function getSvgPathFromStroke(points: number[][], closed?: boolean): string;
export declare const normalizeEOL: (str: string) => string;
export type HasBrand<T> = {
    [K in keyof T]: K extends `~brand${infer _}` | "_brand" ? true : never;
}[keyof T];
type RemoveAllBrands<T> = HasBrand<T> extends true ? {
    [K in keyof T as K extends `~brand~${infer _}` | "_brand" ? never : K]: T[K];
} : T;
type UnbrandForValue<T> = T extends Map<infer E, infer F> ? Map<UnbrandForValue<E>, UnbrandForValue<F>> : T extends Set<infer E> ? Set<UnbrandForValue<E>> : T extends readonly any[] ? T extends any[] ? unknown[] : readonly unknown[] : RemoveAllBrands<T>;
export type Unbrand<T> = T extends Map<infer E, infer F> ? Map<Unbrand<E>, Unbrand<F>> : T extends Set<infer E> ? Set<Unbrand<E>> : T extends readonly (infer E)[] ? Array<Unbrand<E>> : RemoveAllBrands<T>;
export type CombineBrands<BrandedType, CurrentType> = BrandedType extends readonly (infer BE)[] ? CurrentType extends readonly (infer CE)[] ? Array<CE & BE> : CurrentType & BrandedType : CurrentType & BrandedType;
export type CombineBrandsIfNeeded<T, Required> = [T] extends [Required] ? T[] : HasBrand<T> extends true ? CombineBrands<T, Required>[] : Required[];
/**
 * Makes type into a branded type, ensuring that value is assignable to
 * the base unbranded type. Optionally you can explicitly supply current value
 * type to combine both (useful for composite branded types. Make sure you
 * compose branded types which are not composite themselves.)
 */
export declare function toBrandedType<BrandedType>(value: UnbrandForValue<BrandedType>): BrandedType;
export declare function toBrandedType<BrandedType, CurrentType>(value: CurrentType): CombineBrands<BrandedType, CurrentType>;
export declare const promiseTry: <TValue, TArgs extends unknown[]>(fn: (...args: TArgs) => PromiseLike<TValue> | TValue, ...args: TArgs) => Promise<TValue>;
export declare const isAnyTrue: (...args: boolean[]) => boolean;
export declare const safelyParseJSON: (json: string) => Record<string, any> | null;
/**
 * use when you need to render unsafe string as HTML attribute, but MAKE SURE
 * the attribute is double-quoted when constructing the HTML string
 */
export declare const escapeDoubleQuotes: (str: string) => string;
export declare const castArray: <T>(value: T | T[]) => T[];
/** hack for Array.isArray type guard not working with readonly value[] */
export declare const isReadonlyArray: (value?: any) => value is readonly any[];
export declare const sizeOf: (value: readonly unknown[] | Readonly<Map<string, unknown>> | Readonly<Record<string, unknown>> | ReadonlySet<unknown>) => number;
export declare const reduceToCommonValue: <T, R = T>(collection: readonly T[] | ReadonlySet<T>, getValue?: (item: T) => R) => R | null;
type FEATURE_FLAGS = {
    COMPLEX_BINDINGS: boolean;
};
export declare const getFeatureFlag: <F extends keyof FEATURE_FLAGS>(flag: F) => FEATURE_FLAGS[F];
export declare const setFeatureFlag: <F extends keyof FEATURE_FLAGS>(flag: F, value: FEATURE_FLAGS[F]) => void;
export declare const oneOf: <N extends string | number | symbol | null, H extends N>(needle: N, haystack: readonly H[]) => needle is H;
export {};
