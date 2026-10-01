import React from "react";
export type ActionProps = {
    title: string;
    children: React.ReactNode;
    actionLabel: string;
    onClick: () => void;
};
export declare const Action: ({ title, children, actionLabel, onClick, }: ActionProps) => import("react/jsx-runtime").JSX.Element;
export declare const ExportToImage: () => import("react/jsx-runtime").JSX.Element;
export declare const SaveToDisk: () => import("react/jsx-runtime").JSX.Element;
declare const Actions: (({ children }: {
    children: React.ReactNode;
}) => import("react/jsx-runtime").JSX.Element) & {
    ExportToImage: () => import("react/jsx-runtime").JSX.Element;
    SaveToDisk: () => import("react/jsx-runtime").JSX.Element;
};
export { Actions };
