import { type GlobalPoint } from "../math/src/index";
import type { EditorInterface } from "../common/src/index";
import type { ExcalidrawTextElement } from "../element/src/types";
export declare const getTextBoxPadding: (zoomValue: number) => number;
export declare const getTextAutoResizeHandle: (textElement: ExcalidrawTextElement, zoomValue: number, formFactor: EditorInterface["formFactor"]) => {
    center: GlobalPoint | import("../math/src/index").LocalPoint;
    start: GlobalPoint;
    end: GlobalPoint;
    hitboxWidth: number;
    hitboxHeight: number;
} | null;
export declare const isPointHittingTextAutoResizeHandle: (point: Readonly<{
    x: number;
    y: number;
}>, textElement: ExcalidrawTextElement, zoomValue: number, formFactor: EditorInterface["formFactor"]) => boolean;
