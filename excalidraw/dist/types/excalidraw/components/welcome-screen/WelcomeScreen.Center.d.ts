import type { JSX } from "react";
declare const Center: {
    ({ children }: {
        children?: React.ReactNode;
    }): import("react/jsx-runtime").JSX.Element;
    displayName: string;
    Logo: {
        ({ children }: {
            children?: React.ReactNode;
        }): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    Heading: {
        ({ children }: {
            children: React.ReactNode;
        }): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    Menu: {
        ({ children }: {
            children?: React.ReactNode;
        }): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    MenuItem: {
        ({ onSelect, children, icon, shortcut, className, ...props }: {
            onSelect: () => void;
            children: React.ReactNode;
            icon?: JSX.Element;
            shortcut?: string | null;
        } & React.ButtonHTMLAttributes<HTMLButtonElement>): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    MenuItemLink: {
        ({ children, href, icon, shortcut, className, ...props }: {
            children: React.ReactNode;
            href: string;
            icon?: JSX.Element;
            shortcut?: string | null;
        } & React.AnchorHTMLAttributes<HTMLAnchorElement>): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    MenuItemHelp: {
        (): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    MenuItemLoadScene: {
        (): import("react/jsx-runtime").JSX.Element | null;
        displayName: string;
    };
    MenuItemLiveCollaborationTrigger: {
        ({ onSelect, }: {
            onSelect: () => any;
        }): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
};
export { Center };
