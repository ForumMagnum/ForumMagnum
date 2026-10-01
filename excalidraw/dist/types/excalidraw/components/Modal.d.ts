import "./Modal.scss";
import type { AppState } from "../types";
export declare const Modal: React.FC<{
    className?: string;
    children: React.ReactNode;
    maxWidth?: number;
    onCloseRequest(): void;
    labelledBy: string;
    theme?: AppState["theme"];
    closeOnClickOutside?: boolean;
}>;
