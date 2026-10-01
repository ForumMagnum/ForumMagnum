import type { ReactElement } from "react";
/**
 * right-click context menu of a customizable top-picks strip, resetting it
 * to its default picks. Renders the strip as-is when not customizable.
 */
export declare const TopPicksContextMenu: ({ children, onReset, isCustomized, resetLabel, }: {
    /** the strip (must accept a ref — used as the menu trigger) */
    children: ReactElement;
    /** present when the strip is user-customizable */
    onReset?: () => void;
    /** whether custom picks are currently applied (enables the reset item) */
    isCustomized: boolean;
    resetLabel: string;
}) => import("react/jsx-runtime").JSX.Element;
