import { MIME_TYPES } from "../../common/src/index";
import type { ExcalidrawFrameLikeElement, NonDeleted, NonDeletedExcalidrawElement } from "../../element/src/types";
import type { AppState, BinaryFiles } from "../../excalidraw/types";
export { MIME_TYPES };
type ExportOpts = {
    /** restored before exporting */
    elements: readonly NonDeletedExcalidrawElement[];
    appState?: Partial<Omit<AppState, "offsetTop" | "offsetLeft">>;
    files: BinaryFiles | null;
    maxWidthOrHeight?: number;
    exportingFrame?: NonDeleted<ExcalidrawFrameLikeElement> | null;
    getDimensions?: (width: number, height: number) => {
        width: number;
        height: number;
        scale?: number;
    };
};
export declare const exportToCanvas: ({ elements, appState, files, maxWidthOrHeight, getDimensions, exportPadding, exportingFrame, }: ExportOpts & {
    exportPadding?: number;
}) => Promise<HTMLCanvasElement>;
export declare const exportToBlob: (opts: ExportOpts & {
    mimeType?: string;
    quality?: number;
    exportPadding?: number;
}) => Promise<Blob>;
export declare const exportToSvg: ({ elements, appState, files, exportPadding, renderEmbeddables, exportingFrame, skipInliningFonts, reuseImages, }: Omit<ExportOpts, "getDimensions"> & {
    exportPadding?: number;
    renderEmbeddables?: boolean;
    skipInliningFonts?: true;
    reuseImages?: boolean;
}) => Promise<SVGSVGElement>;
export declare const exportToClipboard: (opts: ExportOpts & {
    mimeType?: string;
    quality?: number;
    type: "png" | "svg" | "json";
}) => Promise<void>;
