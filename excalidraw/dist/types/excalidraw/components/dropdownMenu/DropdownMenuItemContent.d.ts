import type { JSX } from "react";
declare const MenuItemContent: ({ textStyle, icon, shortcut, children, badge, }: {
    icon?: JSX.Element;
    shortcut?: string;
    textStyle?: React.CSSProperties;
    children: React.ReactNode;
    badge?: React.ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export default MenuItemContent;
