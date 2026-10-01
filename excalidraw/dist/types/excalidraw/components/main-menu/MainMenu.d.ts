import React from "react";
import * as DefaultItems from "./DefaultItems";
declare const MainMenu: React.FC<{
    children?: React.ReactNode;
    /**
     * Called when any menu item is selected (clicked on).
     */
    onSelect?: (event: Event) => void;
} & {
    __fallback?: boolean;
}> & {
    Trigger: {
        ({ className, children, onToggle, title, ...rest }: {
            className?: string;
            children: React.ReactNode;
            onToggle: () => void;
            title?: string;
        } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect">): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    Item: {
        ({ icon, badge, value, children, shortcut, className, selected, onSelect, ...rest }: import("../dropdownMenu/DropdownMenuItem").DropdownMenuItemProps): import("react/jsx-runtime").JSX.Element;
        displayName: string;
        Badge: {
            ({ type, children, }: {
                type?: import("../../../common/src/utility-types").ValueOf<typeof import("../dropdownMenu/DropdownMenuItem").DropDownMenuItemBadgeType>;
                children: React.ReactNode;
            }): import("react/jsx-runtime").JSX.Element;
            displayName: string;
        };
    };
    ItemLink: {
        ({ icon, shortcut, href, children, onSelect, className, selected, rel, ...rest }: {
            href: string;
            icon?: React.JSX.Element;
            children: React.ReactNode;
            shortcut?: string;
            className?: string;
            selected?: boolean;
            onSelect?: (event: Event) => void;
            rel?: string;
        } & React.AnchorHTMLAttributes<HTMLAnchorElement>): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    ItemCustom: ({ children, className, selected, ...rest }: {
        children: React.ReactNode;
        className?: string;
        selected?: boolean;
    } & React.HTMLAttributes<HTMLDivElement>) => import("react/jsx-runtime").JSX.Element;
    Group: {
        ({ children, className, style, title, }: {
            children: React.ReactNode;
            className?: string;
            style?: React.CSSProperties;
            title?: string;
        }): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    Separator: {
        (): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    Sub: {
        ({ children }: {
            children?: React.ReactNode;
        }): import("react/jsx-runtime").JSX.Element;
        Trigger: {
            ({ children, icon, shortcut, className, }: {
                children: React.ReactNode;
                icon?: React.JSX.Element;
                shortcut?: string;
                className?: string;
            }): import("react/jsx-runtime").JSX.Element;
            displayName: string;
        };
        Content: {
            ({ children, className, }: {
                children?: React.ReactNode;
                className?: string;
            }): import("react/jsx-runtime").JSX.Element;
            displayName: string;
        };
        displayName: string;
    };
    DefaultItems: typeof DefaultItems;
};
export default MainMenu;
