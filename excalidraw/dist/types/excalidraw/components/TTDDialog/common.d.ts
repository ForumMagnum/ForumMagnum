import type { NonDeletedExcalidrawElement, Theme } from "../../../element/src/types";
import type { MermaidToExcalidrawLibProps } from "./types";
import type { AppClassProperties, BinaryFiles } from "../../types";
export declare const resetPreview: ({ canvasRef, setError, }: {
    canvasRef: React.RefObject<HTMLDivElement | null>;
    setError: (error: Error | null) => void;
}) => void;
export declare const convertMermaidToExcalidraw: ({ canvasRef, mermaidToExcalidrawLib, mermaidDefinition, setError, data, theme, }: {
    canvasRef: React.RefObject<HTMLDivElement | null>;
    mermaidToExcalidrawLib: MermaidToExcalidrawLibProps;
    mermaidDefinition: string;
    setError: (error: Error | null) => void;
    data: React.MutableRefObject<{
        elements: readonly NonDeletedExcalidrawElement[];
        files: BinaryFiles | null;
    }>;
    theme: Theme;
}) => Promise<{
    success: true;
} | {
    success: false;
    error?: Error;
}>;
export declare const saveMermaidDataToStorage: (mermaidDefinition: string) => void;
export declare const insertToEditor: ({ app, data, text, shouldSaveMermaidDataToStorage, }: {
    app: AppClassProperties;
    data: React.MutableRefObject<{
        elements: readonly NonDeletedExcalidrawElement[];
        files: BinaryFiles | null;
    }>;
    text?: string;
    shouldSaveMermaidDataToStorage?: boolean;
}) => void;
