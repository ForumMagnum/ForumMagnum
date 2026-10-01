import "./Toast.scss";
import type { CSSProperties, ReactNode } from "react";
export declare const Toast: (({ message, onClose, closable, duration, style, }: {
    message: ReactNode;
    onClose: () => void;
    closable?: boolean;
    duration?: number;
    style?: CSSProperties;
}) => import("react/jsx-runtime").JSX.Element) & {
    ProgressBar: ({ progress }: {
        progress: number;
    }) => import("react/jsx-runtime").JSX.Element;
};
