import type { MarkOptional } from "../../common/src/utility-types";
import type { ExcalidrawImageElement, ExcalidrawTextElement, ExcalidrawLinearElement, ExcalidrawGenericElement, NonDeleted, TextAlign, VerticalAlign, Arrowhead, ExcalidrawFreeDrawElement, FontFamilyValues, ExcalidrawTextContainer, ExcalidrawFrameElement, ExcalidrawEmbeddableElement, ExcalidrawMagicFrameElement, ExcalidrawIframeElement, ElementsMap, ExcalidrawArrowElement, ExcalidrawElbowArrowElement, ExcalidrawLineElement, ExcalidrawStickyNoteElement } from "./types";
export type ElementConstructorOpts = MarkOptional<Omit<ExcalidrawGenericElement, "id" | "type" | "isDeleted" | "updated">, "width" | "height" | "angle" | "groupIds" | "frameId" | "index" | "boundElements" | "seed" | "version" | "versionNonce" | "link" | "strokeStyle" | "fillStyle" | "strokeColor" | "backgroundColor" | "roughness" | "strokeWidth" | "roundness" | "locked" | "opacity" | "customData" | "created">;
export declare const newElement: (opts: {
    type: ExcalidrawGenericElement["type"];
} & ElementConstructorOpts) => NonDeleted<ExcalidrawGenericElement>;
/**
 * Style invariants of a sticky note: never-transparent colors, solid fill.
 * Applied by the constructor and by every normalization pass. Returns the
 * same object when nothing needs fixing.
 */
export declare const normalizeStickyNoteStyle: <T extends ExcalidrawStickyNoteElement>(element: T) => T;
/**
 * Geometry invariants of a *finalized* sticky note: minimum size and
 * `baseHeight ≤ height`. Deliberately not part of the constructor — a
 * pointer-down draft starts at 0×0 like every other tool and is previewed at
 * its true dragged size; pointer-up, restore, the skeleton path and the
 * action post-passes enforce this.
 */
export declare const normalizeStickyNoteGeometry: <T extends ExcalidrawStickyNoteElement>(element: T) => T;
/** all sticky note invariants (style + finalized geometry) */
export declare const normalizeStickyNote: <T extends ExcalidrawStickyNoteElement>(element: T) => T;
export declare const newStickyNoteElement: (opts: {
    type: "stickynote";
    baseHeight?: number;
} & ElementConstructorOpts) => NonDeleted<ExcalidrawStickyNoteElement>;
export declare const newEmbeddableElement: (opts: {
    type: "embeddable";
} & ElementConstructorOpts) => NonDeleted<ExcalidrawEmbeddableElement>;
export declare const newIframeElement: (opts: {
    type: "iframe";
} & ElementConstructorOpts) => NonDeleted<ExcalidrawIframeElement>;
export declare const newFrameElement: (opts: {
    name?: string;
} & ElementConstructorOpts) => NonDeleted<ExcalidrawFrameElement>;
export declare const newMagicFrameElement: (opts: {
    name?: string;
} & ElementConstructorOpts) => NonDeleted<ExcalidrawMagicFrameElement>;
/**
 * The point of the text box its alignment pins, as ratios of width/height.
 *
 * This is the point that stays put as the text grows — see the sides passed to
 * `adjustXYWithRotation` in `getAdjustedDimensions`.
 */
export declare const getTextAnchorRatios: (opts: {
    textAlign: ExcalidrawTextElement["textAlign"];
    verticalAlign: ExcalidrawTextElement["verticalAlign"];
}) => {
    x: number;
    y: number;
};
export declare const newTextElement: (opts: {
    text: string;
    originalText?: string;
    fontSize?: number;
    fontFamily?: FontFamilyValues;
    textAlign?: TextAlign;
    verticalAlign?: VerticalAlign;
    containerId?: ExcalidrawTextContainer["id"] | null;
    lineHeight?: ExcalidrawTextElement["lineHeight"];
    autoResize?: ExcalidrawTextElement["autoResize"];
    labelPosition?: ExcalidrawTextElement["labelPosition"];
    baseFontSize?: ExcalidrawTextElement["baseFontSize"];
} & ElementConstructorOpts) => NonDeleted<ExcalidrawTextElement>;
export declare const refreshTextDimensions: (textElement: ExcalidrawTextElement, container: ExcalidrawTextContainer | null, elementsMap: ElementsMap, text?: string, 
/**
 * For a free text that grows with its content (`autoResize`): the widest
 * it may grow to. Crossing it, the text stops growing and wraps at this
 * width from then on (`autoResize: false`), anchored as its growth was. A
 * text that is already wider keeps growing.
 */
maxWidth?: number) => {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    autoResize: boolean;
} | {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
} | undefined;
export declare const newFreeDrawElement: (opts: {
    type: "freedraw";
    points?: ExcalidrawFreeDrawElement["points"];
    simulatePressure: boolean;
    strokeOptions?: ExcalidrawFreeDrawElement["strokeOptions"];
    pressures?: ExcalidrawFreeDrawElement["pressures"];
} & ElementConstructorOpts) => NonDeleted<ExcalidrawFreeDrawElement>;
export declare const newLinearElement: (opts: {
    type: ExcalidrawLinearElement["type"];
    points?: ExcalidrawLinearElement["points"];
    polygon?: ExcalidrawLineElement["polygon"];
} & ElementConstructorOpts) => NonDeleted<ExcalidrawLinearElement>;
export declare const newArrowElement: <T extends boolean>(opts: {
    type: ExcalidrawArrowElement["type"];
    startArrowhead?: Arrowhead | null;
    endArrowhead?: Arrowhead | null;
    points?: ExcalidrawArrowElement["points"];
    elbowed?: T;
    fixedSegments?: ExcalidrawElbowArrowElement["fixedSegments"] | null;
} & ElementConstructorOpts) => T extends true ? NonDeleted<ExcalidrawElbowArrowElement> : NonDeleted<ExcalidrawArrowElement>;
export declare const newImageElement: (opts: {
    type: ExcalidrawImageElement["type"];
    status?: ExcalidrawImageElement["status"];
    fileId?: ExcalidrawImageElement["fileId"];
    scale?: ExcalidrawImageElement["scale"];
    crop?: ExcalidrawImageElement["crop"];
} & ElementConstructorOpts) => NonDeleted<ExcalidrawImageElement>;
