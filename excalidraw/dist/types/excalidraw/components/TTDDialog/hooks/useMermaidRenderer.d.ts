import type { NonDeletedExcalidrawElement } from "../../../../element/src/types";
import type { BinaryFiles } from "../../../types";
import type { MermaidToExcalidrawLibProps } from "../types";
interface UseMermaidRendererProps {
    mermaidToExcalidrawLib: MermaidToExcalidrawLibProps;
    canvasRef: React.RefObject<HTMLDivElement | null>;
}
export declare const useMermaidRenderer: ({ mermaidToExcalidrawLib, canvasRef, }: UseMermaidRendererProps) => {
    data: import("react").RefObject<{
        elements: readonly NonDeletedExcalidrawElement[];
        files: BinaryFiles | null;
    }>;
};
export {};
