import type { ReactNode } from "react";
export type TTDPanelAction = {
    label: string;
    action?: () => void;
    icon?: ReactNode;
    variant: "button" | "link" | "rateLimit";
    disabled?: boolean;
    className?: string;
};
interface TTDDialogPanelProps {
    label?: string | ReactNode;
    children: ReactNode;
    panelActions?: TTDPanelAction[];
    onTextSubmitInProgess?: boolean;
    renderTopRight?: () => ReactNode;
    renderSubmitShortcut?: () => ReactNode;
    className?: string;
    panelActionJustifyContent?: "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly";
}
export declare const TTDDialogPanel: ({ label, children, panelActions, onTextSubmitInProgess, renderTopRight, renderSubmitShortcut, className, panelActionJustifyContent, }: TTDDialogPanelProps) => import("react/jsx-runtime").JSX.Element;
export {};
