import type { AppClassProperties, DataURL, BinaryFiles } from "../../excalidraw/types";
import type { ExcalidrawElement, FileId, InitializedExcalidrawImageElement } from "./types";
export declare const loadHTMLImageElement: (dataURL: DataURL) => Promise<HTMLImageElement>;
/** NOTE: updates cache even if already populated with given image. Thus,
 * you should filter out the images upstream if you want to optimize this. */
export declare const updateImageCache: ({ fileIds, files, imageCache, }: {
    fileIds: FileId[];
    files: BinaryFiles;
    imageCache: AppClassProperties["imageCache"];
}) => Promise<{
    imageCache: Map<FileId, {
        image: HTMLImageElement | Promise<HTMLImageElement>;
        mimeType: import("../../common/src/utility-types").ValueOf<typeof import("../../common/src/index").IMAGE_MIME_TYPES>;
    }>;
    /** includes errored files because they cache was updated nonetheless */
    updatedFiles: Map<FileId, true>;
    /** files that failed when creating HTMLImageElement */
    erroredFiles: Map<FileId, true>;
}>;
export declare const getInitializedImageElements: (elements: readonly ExcalidrawElement[]) => InitializedExcalidrawImageElement[];
export declare const isHTMLSVGElement: (node: Node | null) => node is SVGElement;
export declare const normalizeSVG: (SVGString: string) => string;
