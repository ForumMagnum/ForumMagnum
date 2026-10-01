import type { ReactNode } from "react";
declare const TTDDialogTabs: {
    (props: {
        children: ReactNode;
    } & {
        dialog: "ttd";
        tab: "text-to-diagram" | "mermaid";
    }): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export default TTDDialogTabs;
