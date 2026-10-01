import type { ExcalidrawElement, ExcalidrawFrameLikeElement, NonDeleted, NonDeletedExcalidrawElement } from "../../element/src/types";
import type { ExportType } from "../scene/types";
import type { AppState, BinaryFiles } from "../types";
export { loadFromBlob } from "./blob";
export { loadFromJSON, saveAsJSON } from "./json";
export type ExportedElements = readonly NonDeletedExcalidrawElement[] & {
    _brand: "exportedElements";
};
export declare const prepareElementsForExport: (allElements: readonly ExcalidrawElement[], { selectedElementIds }: Pick<AppState, "selectedElementIds">, exportSelectionOnly: boolean) => {
    exportingFrame: NonDeleted<ExcalidrawFrameLikeElement> | null;
    exportedElements: ExportedElements;
};
export declare const exportCanvas: (type: Omit<ExportType, "backend">, elements: ExportedElements, appState: AppState, files: BinaryFiles, { exportBackground, exportPadding, viewBackgroundColor, name, fileHandle, exportingFrame, }: {
    exportBackground: boolean;
    exportPadding?: number;
    viewBackgroundColor: string;
    /** filename, if applicable */
    name?: string;
    fileHandle?: FileSystemFileHandle | null;
    exportingFrame: NonDeleted<ExcalidrawFrameLikeElement> | null;
}) => Promise<FileSystemFileHandle | null | undefined>;
