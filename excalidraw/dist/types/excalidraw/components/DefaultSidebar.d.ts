import type { MarkOptional } from "../../common/src/utility-types";
import "../components/dropdownMenu/DropdownMenu.scss";
import type { SidebarProps, SidebarTriggerProps } from "./Sidebar/common";
export declare const DefaultSidebar: import("react").FC<Omit<MarkOptional<Omit<{
    name: import("../types").SidebarName;
    children: React.ReactNode;
    onStateChange?: (state: import("../types").AppState["openSidebar"]) => void;
    onDock?: (docked: boolean) => void;
    docked?: boolean;
    className?: string;
    __fallback?: boolean;
}, "name">, "children">, "onDock"> & {
    /** pass `false` to disable docking */
    onDock?: SidebarProps["onDock"] | false;
} & {
    __fallback?: boolean;
}> & {
    Trigger: import("react").FC<Omit<SidebarTriggerProps, "name"> & import("react").HTMLAttributes<HTMLDivElement> & {
        __fallback?: boolean;
    }>;
    TabTriggers: {
        ({ children }: {
            children: React.ReactNode;
        }): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
};
