interface TTDPreviewPanelProps {
    canvasRef: React.RefObject<HTMLDivElement | null>;
    error: Error | null;
    loaded: boolean;
    onInsert: () => void;
    hideErrorDetails?: boolean;
}
export declare const TTDPreviewPanel: ({ canvasRef, error, loaded, onInsert, hideErrorDetails, }: TTDPreviewPanelProps) => import("react/jsx-runtime").JSX.Element;
export {};
