import type { GlobalPoint } from "../../math/src/index";
import type { ElementsMap, ExcalidrawElement, ExcalidrawLineElement, NonDeletedExcalidrawElement } from "./types";
export type BucketFillOptions = {
    /**
     * geometric fidelity: vertices closer than this collapse to the same graph
     * node, and a node this close to a stroke splits it (T-junction). Keep
     * SMALL — every merge can relocate a vertex by up to this distance, so
     * this value is the upper bound on how far the filled shape may deviate
     * from the actual strokes.
     */
    snapEpsilon: number;
    /**
     * connectivity: loose stroke ends within this distance of another stroke
     * are bridged with a connector edge so the region reads as closed. Also
     * used as broad-phase padding around the owner bounds. Unlike
     * `snapEpsilon` this does not affect the shape's fidelity (bridges add
     * edges; they never move existing vertices).
     */
    gapTolerance: number;
    /** discard faces / polygons smaller than this absolute area */
    minArea: number;
    /** bail out with `too_complex` above this many input segments */
    maxBoundarySegments: number;
    /** cap on the number of generated polygon points */
    maxGeneratedPoints: number;
    /**
     * initial half-extent of the owner-less search box around the click
     * (doubles up to 3 times while the found face touches the box frontier)
     */
    fallbackSearchRadius: number;
};
export declare const DEFAULT_BUCKET_FILL_OPTIONS: BucketFillOptions;
export type BucketFillFailureReason = "no_owner" | "open_region" | "too_complex" | "too_small" | "invalid_polygon";
/**
 * Where the generated fill element belongs in the scene order, expressed
 * relative to an existing element so the caller can resolve it against
 * whatever (e.g. deleted-inclusive) array it inserts into.
 */
export type BucketFillInsertion = {
    placement: "above" | "below";
    elementId: ExcalidrawElement["id"];
};
export type BucketFillGeometryResult = {
    ok: true;
    /**
     * the closed element under the click, or null for fills resolved by
     * the owner-less fallback (regions formed by open lines)
     */
    ownerId: ExcalidrawElement["id"] | null;
    boundaryElementIds: ExcalidrawElement["id"][];
    /**
     * closed polygon ring in scene coordinates. When the region contains
     * islands, this is a keyhole path: the hole contours are spliced in
     * via zero-width bridges, so it still renders as one polygon with
     * unpainted hole interiors
     */
    scenePoints: GlobalPoint[];
    insertion: BucketFillInsertion;
} | {
    ok: false;
    reason: BucketFillFailureReason;
};
/**
 * Whether the element visually paints an opaque background fill — i.e. can
 * actually hide outlines beneath it. Element types that never render their
 * `backgroundColor` (text, image, frames), see-through fill styles
 * (hachure/cross-hatch), partial element opacity, and colors with an alpha
 * channel below 1 (`#RRGGBBAA`, `rgba(…)`) all don't count — anything under
 * them shows through.
 *
 * Shared with the app layer's z-order pass so "covers" means the same thing
 * in boundary clipping and in fill insertion.
 */
export declare const rendersOpaqueFill: (element: ExcalidrawElement) => boolean;
/**
 * Whether the element renders as pure paint the bucket tool could have
 * produced: a closed, visible line polygon with a background and no visible
 * stroke. Recognition is by SHAPE, not by a metadata marker — any marker
 * would go stale the moment the user restyles a fill, and a hand-drawn
 * strokeless background polygon is indistinguishable from a generated fill
 * anyway. Such paint never becomes an owner and is what the app layer
 * restyles in place on re-click (see `isRestylableFill`).
 */
export declare const isBucketFillCompatible: (element: ExcalidrawElement) => element is ExcalidrawLineElement;
export declare const computeBucketFillPolygon: (args: {
    point: GlobalPoint;
    elements: readonly NonDeletedExcalidrawElement[];
    elementsMap: ElementsMap;
    options?: Partial<BucketFillOptions>;
}) => BucketFillGeometryResult;
/**
 * Whether the element the click landed on is a fill the bucket tool should
 * restyle in place (instead of stacking an identical fill on top), given
 * the computed region.
 *
 * Fill-compatibility is decided by shape (`isBucketFillCompatible`): a fill
 * the user gave a stroke to has been repurposed into an outline and
 * participates as a boundary instead of being restyled.
 *
 * One guard on top: the computed region's net area and bounds must match
 * the element's. Without it, a click inside a shape drawn ON TOP of a
 * filled region would recolor the underlying fill instead of filling that
 * shape; a click on a since-subdivided part of an old fill likewise
 * creates a new (smaller) fill rather than restyling the old one.
 */
export declare const isRestylableFill: (args: {
    hitElement: ExcalidrawElement;
    scenePoints: readonly GlobalPoint[];
    elementsMap: ElementsMap;
}) => boolean;
