interface TTDDialogOutputProps {
    error: Error | null;
    canvasRef: React.RefObject<HTMLDivElement | null>;
    loaded: boolean;
    hideErrorDetails?: boolean;
    sourceText?: string;
    autoFixAvailable?: boolean;
    onApplyAutoFix?: () => void;
}
export declare const TTDDialogOutput: ({ error, canvasRef, loaded, hideErrorDetails, sourceText, autoFixAvailable, onApplyAutoFix, }: TTDDialogOutputProps) => import("react/jsx-runtime").JSX.Element;
export {};
