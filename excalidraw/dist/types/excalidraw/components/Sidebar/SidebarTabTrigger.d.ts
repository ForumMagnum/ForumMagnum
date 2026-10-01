import type { SidebarTabName } from "../../types";
export declare const SidebarTabTrigger: {
    ({ children, tab, onSelect, ...rest }: {
        children: React.ReactNode;
        tab: SidebarTabName;
        onSelect?: React.ReactEventHandler<HTMLButtonElement> | undefined;
    } & Omit<React.HTMLAttributes<HTMLButtonElement>, "onSelect">): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
