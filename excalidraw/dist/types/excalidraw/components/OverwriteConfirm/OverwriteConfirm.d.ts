import React from "react";
import "./OverwriteConfirm.scss";
export type OverwriteConfirmDialogProps = {
    children: React.ReactNode;
};
declare const OverwriteConfirmDialog: React.FC<OverwriteConfirmDialogProps & {
    __fallback?: boolean;
}> & {
    Actions: (({ children }: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element) & {
        ExportToImage: () => import("react/jsx-runtime").JSX.Element;
        SaveToDisk: () => import("react/jsx-runtime").JSX.Element;
    };
    Action: ({ title, children, actionLabel, onClick, }: import("./OverwriteConfirmActions").ActionProps) => import("react/jsx-runtime").JSX.Element;
};
export { OverwriteConfirmDialog };
