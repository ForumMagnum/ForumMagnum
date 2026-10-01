import type { ExcalidrawFrameLikeElement, NonDeleted, NonDeletedExcalidrawElement } from "../../element/src/types";
import type { AppState, BinaryFiles } from "../types";
export declare const exportToCanvas: (elements: readonly NonDeletedExcalidrawElement[], appState: AppState, files: BinaryFiles, { exportBackground, exportPadding, viewBackgroundColor, exportingFrame, }: {
    exportBackground: boolean;
    exportPadding?: number;
    viewBackgroundColor: string;
    exportingFrame?: NonDeleted<ExcalidrawFrameLikeElement> | null;
}, createCanvas?: (width: number, height: number) => {
    canvas: HTMLCanvasElement;
    scale: number;
}, loadFonts?: () => Promise<void>) => Promise<HTMLCanvasElement>;
export declare const exportToSvg: (elements: readonly NonDeletedExcalidrawElement[], appState: {
    exportBackground: boolean;
    exportPadding?: number;
    exportScale?: number;
    viewBackgroundColor: string;
    exportWithDarkMode?: boolean;
    exportEmbedScene?: boolean;
    frameRendering?: AppState["frameRendering"];
}, files: BinaryFiles | null, opts?: {
    /**
     * if true, all embeddables passed in will be rendered when possible.
     */
    renderEmbeddables?: boolean;
    exportingFrame?: NonDeleted<ExcalidrawFrameLikeElement> | null;
    skipInliningFonts?: true;
    reuseImages?: boolean;
}) => Promise<SVGSVGElement>;
export declare const encodeSvgBase64Payload: ({ payload, metadataElement, }: {
    payload: string;
    metadataElement: SVGMetadataElement;
}) => void;
export declare const decodeSvgBase64Payload: ({ svg }: {
    svg: string;
}) => string;
export declare const getExportSize: (elements: readonly NonDeletedExcalidrawElement[], exportPadding: number, scale: number) => [number, number];
