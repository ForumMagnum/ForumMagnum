import React from "react";
import "./Sidebar.scss";
/**
 * Flags whether the currently rendered Sidebar is docked or not, for use
 * in upstream components that need to act on this (e.g. LayerUI to shift the
 * UI). We use an atom because of potential host app sidebars (for the default
 * sidebar we could just read from appState.defaultSidebarDockedPreference).
 *
 * Since we can only render one Sidebar at a time, we can use a simple flag.
 */
export declare const isSidebarDockedAtom: import("jotai").PrimitiveAtom<boolean> & {
    init: boolean;
};
export declare const SidebarInner: React.ForwardRefExoticComponent<Omit<{
    name: import("../../types").SidebarName;
    children: React.ReactNode;
    onStateChange?: (state: import("../../types").AppState["openSidebar"]) => void;
    onDock?: (docked: boolean) => void;
    docked?: boolean;
    className?: string;
    __fallback?: boolean;
} & Omit<React.RefAttributes<HTMLDivElement>, "onSelect">, "ref"> & React.RefAttributes<HTMLDivElement>>;
export declare const Sidebar: React.ForwardRefExoticComponent<{
    name: import("../../types").SidebarName;
    children: React.ReactNode;
    onStateChange?: (state: import("../../types").AppState["openSidebar"]) => void;
    onDock?: (docked: boolean) => void;
    docked?: boolean;
    className?: string;
    __fallback?: boolean;
} & React.RefAttributes<HTMLDivElement>> & {
    Header: {
        ({ children, className, }: {
            children?: React.ReactNode;
            className?: string;
        }): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    TabTriggers: {
        ({ children, ...rest }: {
            children: React.ReactNode;
        } & Omit<React.RefAttributes<HTMLDivElement>, "onSelect">): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    TabTrigger: {
        ({ children, tab, onSelect, ...rest }: {
            children: React.ReactNode;
            tab: import("../../types").SidebarTabName;
            onSelect?: React.ReactEventHandler<HTMLButtonElement> | undefined;
        } & Omit<React.HTMLAttributes<HTMLButtonElement>, "onSelect">): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    Tabs: {
        ({ children, ...rest }: {
            children: React.ReactNode;
        } & Omit<React.RefAttributes<HTMLDivElement>, "onSelect">): import("react/jsx-runtime").JSX.Element | null;
        displayName: string;
    };
    Tab: {
        ({ tab, children, ...rest }: {
            tab: import("../../types").SidebarTabName;
            children: React.ReactNode;
        } & React.HTMLAttributes<HTMLDivElement>): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    Trigger: {
        ({ name, tab, icon, title, children, onToggle, className, style, }: import("./common").SidebarTriggerProps): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
};
