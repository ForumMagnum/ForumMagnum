import React from "react";
import type { JSX } from "react";
declare const DropdownMenuItemLink: {
    ({ icon, shortcut, href, children, onSelect, className, selected, rel, ...rest }: {
        href: string;
        icon?: JSX.Element;
        children: React.ReactNode;
        shortcut?: string;
        className?: string;
        selected?: boolean;
        onSelect?: (event: Event) => void;
        rel?: string;
    } & React.AnchorHTMLAttributes<HTMLAnchorElement>): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export default DropdownMenuItemLink;
