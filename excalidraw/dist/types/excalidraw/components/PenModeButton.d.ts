type PenModeButtonProps = {
    title?: string;
    checked: boolean;
    onChange?(): void;
    isMobile?: boolean;
    penDetected: boolean;
};
export declare const PenModeButton: (props: PenModeButtonProps) => import("react/jsx-runtime").JSX.Element | null;
export {};
