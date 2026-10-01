import { ALLOWED_PASTE_MIME_TYPES } from "../common/src/index";
import type { ValueOf } from "../common/src/utility-types";
import type { IMAGE_MIME_TYPES, STRING_MIME_TYPES } from "../common/src/index";
import type { ExcalidrawElement, NonDeletedExcalidrawElement } from "../element/src/types";
import type { BinaryFiles } from "./types";
export type PastedMixedContent = {
    type: "text" | "imageUrl";
    value: string;
}[];
export interface ClipboardData {
    elements?: readonly ExcalidrawElement[];
    files?: BinaryFiles;
    text?: string;
    mixedContent?: PastedMixedContent;
    errorMessage?: string;
    programmaticAPI?: boolean;
}
type AllowedPasteMimeTypes = typeof ALLOWED_PASTE_MIME_TYPES[number];
export declare const probablySupportsClipboardReadText: boolean;
export declare const probablySupportsClipboardWriteText: boolean;
export declare const probablySupportsClipboardBlob: boolean;
export declare const createPasteEvent: ({ types, files, }: {
    types?: { [key in AllowedPasteMimeTypes]?: string | File; };
    files?: File[];
}) => ClipboardEvent;
export declare const serializeAsClipboardJSON: ({ elements, files, }: {
    elements: readonly NonDeletedExcalidrawElement[];
    files: BinaryFiles | null;
}) => string;
export declare const copyToClipboard: (elements: readonly NonDeletedExcalidrawElement[], files: BinaryFiles | null, 
/** supply if available to make the operation more certain to succeed */
clipboardEvent?: ClipboardEvent | null) => Promise<void>;
/**
 * Reads OS clipboard programmatically. May not work on all browsers.
 * Will prompt user for permission if not granted.
 */
export declare const readSystemClipboard: () => Promise<{
    "image/svg+xml"?: string | File | undefined;
    "image/png"?: string | File | undefined;
    "image/jpeg"?: string | File | undefined;
    "image/gif"?: string | File | undefined;
    "image/webp"?: string | File | undefined;
    "image/bmp"?: string | File | undefined;
    "image/x-icon"?: string | File | undefined;
    "image/avif"?: string | File | undefined;
    "image/jfif"?: string | File | undefined;
    "text/plain"?: string | File | undefined;
    "text/html"?: string | File | undefined;
}>;
type AllowedParsedDataTransferItem = {
    type: ValueOf<typeof IMAGE_MIME_TYPES>;
    kind: "file";
    file: File;
    fileHandle: FileSystemFileHandle | null;
} | {
    type: ValueOf<typeof STRING_MIME_TYPES>;
    kind: "string";
    value: string;
};
type ParsedDataTransferItem = {
    type: string;
    kind: "file";
    file: File;
    fileHandle: FileSystemFileHandle | null;
} | {
    type: string;
    kind: "string";
    value: string;
};
type ParsedDataTransferItemType<T extends AllowedParsedDataTransferItem["type"]> = AllowedParsedDataTransferItem & {
    type: T;
};
export type ParsedDataTransferFile = Extract<AllowedParsedDataTransferItem, {
    kind: "file";
}>;
export type ParsedDataTranferList = ParsedDataTransferItem[] & {
    /**
     * Only allows filtering by known `string` data types, since `file`
     * types can have multiple items of the same type (e.g. multiple image files)
     * unlike `string` data transfer items.
     */
    findByType: typeof findDataTransferItemType;
    /**
     * Only allows filtering by known `string` data types, since `file`
     * types can have multiple items of the same type (e.g. multiple image files)
     * unlike `string` data transfer items.
     */
    getData: typeof getDataTransferItemData;
    getFiles: typeof getDataTransferFiles;
};
declare const findDataTransferItemType: <T extends ValueOf<typeof STRING_MIME_TYPES>>(this: ParsedDataTranferList, type: T) => ParsedDataTransferItemType<T> | null;
declare const getDataTransferItemData: <T extends ValueOf<typeof STRING_MIME_TYPES>>(this: ParsedDataTranferList, type: T) => ParsedDataTransferItemType<ValueOf<typeof STRING_MIME_TYPES>>["value"] | null;
declare const getDataTransferFiles: (this: ParsedDataTranferList) => ParsedDataTransferFile[];
/** @returns list of MIME types, synchronously */
export declare const parseDataTransferEventMimeTypes: (event: ClipboardEvent | DragEvent | React.DragEvent<HTMLDivElement>) => Set<string>;
export declare const parseDataTransferEvent: (event: ClipboardEvent | DragEvent | React.DragEvent<HTMLDivElement>) => Promise<ParsedDataTranferList>;
/**
 * Attempts to parse clipboard event.
 */
export declare const parseClipboard: (dataList: ParsedDataTranferList, isPlainPaste?: boolean) => Promise<ClipboardData>;
export declare const copyBlobToClipboardAsPng: (blob: Blob | Promise<Blob>) => Promise<void>;
export declare const copyTextToSystemClipboard: <MimeType extends ValueOf<typeof STRING_MIME_TYPES>>(text: string | { [K in MimeType]: string; } | null, clipboardEvent?: ClipboardEvent | null) => Promise<void>;
export declare const isClipboardEvent: (event: React.SyntheticEvent | Event) => event is ClipboardEvent;
export {};
