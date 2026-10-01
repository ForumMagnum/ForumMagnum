import "./TopPicksDnD.scss";
type DragOrigin = {
    kind: "source";
} | {
    kind: "pick";
    index: number;
};
export type TopPicksDragState<T> = {
    value: T;
    origin: DragOrigin;
    /** hovered strip slot — the slot to replace (source drags) or the final
     * position (pick reorders). null while the pointer is outside the strip */
    overIndex: number | null;
    /** index of an already-pinned identical value that blocks the drop */
    duplicateIndex: number | null;
    /** signed distance between strip slot centers (for reorder preview) */
    slotSpan: number;
} | null;
export type TopPicksGhost = {
    /** the ghost's visual. Rendered into `document.body` — outside the
     * editor's CSS scope, so theme-dependent styling must be resolved from the
     * rendered DOM (computed styles) rather than CSS variables */
    content: HTMLElement;
    /** where the ghost spawns (its size) and flies back to on cancel */
    rect: DOMRect;
};
/** called on pointerdown (the source may not stay mounted until the drag
 * activates), for every potential drag — keep it cheap */
export type CreateTopPicksGhost<T> = (args: {
    value: T;
    /** the element the drag started on */
    sourceEl: HTMLElement;
    /** the registered strip */
    stripEl: HTMLElement;
}) => TopPicksGhost;
export type TopPicksDnD<T> = {
    dragState: TopPicksDragState<T>;
    startSourceDrag: (event: React.PointerEvent, value: T | null) => void;
    startPickDrag: (event: React.PointerEvent, index: number, value: T) => void;
    setStripEl: (el: HTMLDivElement | null) => void;
};
/**
 * live preview of the reorder result — the translation (px) moving the pick
 * at `index` to the slot it would occupy if dropped right now
 */
export declare const getTopPickReorderOffset: (dragState: TopPicksDragState<unknown>, index: number) => number;
/** "marching ants" outline hinting that the strip accepts the drop — SVG
 * because CSS dashed outlines/borders can't animate their dash offset */
export declare const TopPicksDnDOutline: () => import("react/jsx-runtime").JSX.Element;
export declare const useTopPicksDnD: <T>({ enabled, picks, onPicksChange, isSamePick, createGhost, }: {
    enabled: boolean;
    picks: readonly T[];
    onPicksChange: (picks: T[]) => void;
    /** value-equality — pins identical to an existing pick are refused */
    isSamePick?: (a: T, b: T) => boolean;
    createGhost: CreateTopPicksGhost<T>;
}) => TopPicksDnD<T>;
export {};
