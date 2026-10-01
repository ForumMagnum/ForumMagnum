import type { MarkOptional } from "../../common/src/utility-types";
import { type ElementConstructorOpts } from "./newElement";
import type { ExcalidrawBindableElement, ExcalidrawElement, ExcalidrawFrameElement, ExcalidrawFreeDrawElement, ExcalidrawGenericElement, ExcalidrawIframeLikeElement, ExcalidrawImageElement, ExcalidrawLinearElement, ExcalidrawMagicFrameElement, ExcalidrawSelectionElement, ExcalidrawTextElement, FileId, FontFamilyValues, NonDeletedExcalidrawElement, Ordered, TextAlign, VerticalAlign, ExcalidrawStickyNoteElement } from "./types";
/**
 * Options for elements generated from a skeleton fragment (bound labels and
 * binding endpoints). Such elements are always constructed fresh, hence they
 * never carry a creation time of their own.
 */
type FragmentConstructorOpts = MarkOptional<Omit<ElementConstructorOpts, "created">, "x" | "y">;
export type ValidLinearElement = {
    type: "arrow" | "line";
    x: number;
    y: number;
    label?: {
        text: string;
        fontSize?: number;
        fontFamily?: FontFamilyValues;
        textAlign?: TextAlign;
        verticalAlign?: VerticalAlign;
    } & FragmentConstructorOpts;
    end?: (({
        type: Exclude<ExcalidrawBindableElement["type"], "image" | "text" | "frame" | "magicframe" | "embeddable" | "iframe">;
        id?: ExcalidrawGenericElement["id"];
    } | {
        id: ExcalidrawGenericElement["id"];
        type?: Exclude<ExcalidrawBindableElement["type"], "image" | "text" | "frame" | "magicframe" | "embeddable" | "iframe">;
    }) | (({
        type: "text";
        text: string;
    } | {
        type?: "text";
        id: ExcalidrawTextElement["id"];
        text: string;
    }) & Partial<Omit<ExcalidrawTextElement, "created">>)) & FragmentConstructorOpts;
    start?: (({
        type: Exclude<ExcalidrawBindableElement["type"], "image" | "text" | "frame" | "magicframe" | "embeddable" | "iframe">;
        id?: ExcalidrawGenericElement["id"];
    } | {
        id: ExcalidrawGenericElement["id"];
        type?: Exclude<ExcalidrawBindableElement["type"], "image" | "text" | "frame" | "magicframe" | "embeddable" | "iframe">;
    }) | (({
        type: "text";
        text: string;
    } | {
        type?: "text";
        id: ExcalidrawTextElement["id"];
        text: string;
    }) & Partial<Omit<ExcalidrawTextElement, "created">>)) & FragmentConstructorOpts;
} & Partial<ExcalidrawLinearElement>;
export type ValidContainer = {
    type: Exclude<ExcalidrawGenericElement["type"], "selection">;
    id?: ExcalidrawGenericElement["id"];
    label?: {
        text: string;
        fontSize?: number;
        fontFamily?: FontFamilyValues;
        textAlign?: TextAlign;
        verticalAlign?: VerticalAlign;
    } & FragmentConstructorOpts;
} & ElementConstructorOpts;
/**
 * A sticky note: an always-filled note whose label auto-fits. `label.fontSize`
 * is the font ceiling the fit shrinks from; the note grows past its height
 * (kept as `baseHeight`) only once the label hits the minimum font size.
 */
export type ValidStickyNote = {
    type: "stickynote";
    id?: ExcalidrawStickyNoteElement["id"];
    label?: Extract<ValidContainer, {
        label?: unknown;
    }>["label"];
} & ElementConstructorOpts & Partial<Pick<ExcalidrawStickyNoteElement, "baseHeight">>;
export type ExcalidrawElementSkeleton = Extract<Exclude<ExcalidrawElement, ExcalidrawSelectionElement>, ExcalidrawIframeLikeElement | ExcalidrawFreeDrawElement> | ({
    type: Extract<ExcalidrawLinearElement["type"], "line">;
    x: number;
    y: number;
} & Partial<ExcalidrawLinearElement>) | ValidContainer | ValidStickyNote | ValidLinearElement | ({
    type: "text";
    text: string;
    x: number;
    y: number;
    id?: ExcalidrawTextElement["id"];
} & Partial<ExcalidrawTextElement>) | ({
    type: Extract<ExcalidrawImageElement["type"], "image">;
    x: number;
    y: number;
    fileId: FileId;
} & Partial<ExcalidrawImageElement>) | ({
    type: "frame";
    children: readonly ExcalidrawElement["id"][];
    name?: string;
} & Partial<ExcalidrawFrameElement>) | ({
    type: "magicframe";
    children: readonly ExcalidrawElement["id"][];
    name?: string;
} & Partial<ExcalidrawMagicFrameElement>);
export declare const convertToExcalidrawElements: (elementsSkeleton: ExcalidrawElementSkeleton[] | null, opts?: {
    regenerateIds: boolean;
}) => Ordered<NonDeletedExcalidrawElement>[];
export {};
