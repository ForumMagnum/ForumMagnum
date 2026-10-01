import React from "react";
import type { ValueOf } from "../../../common/src/utility-types";
import type { JSX } from "react";
export type DropdownMenuItemProps = {
    icon?: JSX.Element;
    badge?: React.ReactNode;
    value?: string | number | undefined;
    onSelect?: (event: Event) => void;
    children: React.ReactNode;
    shortcut?: string;
    selected?: boolean;
    className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect">;
declare const DropdownMenuItem: {
    ({ icon, badge, value, children, shortcut, className, selected, onSelect, ...rest }: DropdownMenuItemProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
    Badge: {
        ({ type, children, }: {
            type?: ValueOf<typeof DropDownMenuItemBadgeType>;
            children: React.ReactNode;
        }): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
};
export declare const DropDownMenuItemBadgeType: {
    readonly GREEN: "green";
    readonly RED: "red";
    readonly BLUE: "blue";
};
export declare const DropDownMenuItemBadge: {
    ({ type, children, }: {
        type?: ValueOf<typeof DropDownMenuItemBadgeType>;
        children: React.ReactNode;
    }): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export default DropdownMenuItem;
