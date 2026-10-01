import React from "react";
declare const MenuContent: {
    ({ children, onClickOutside, className, onSelect, open, align, style, }: {
        children?: React.ReactNode;
        onClickOutside?: () => void;
        className?: string;
        /**
         * Called when any menu item is selected (clicked on).
         */
        onSelect?: (event: Event) => void;
        open?: boolean;
        style?: React.CSSProperties;
        align?: "start" | "center" | "end";
    }): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export default MenuContent;
