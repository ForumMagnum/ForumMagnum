import React from "react";
import "./LibraryMenu.scss";
export declare const isLibraryMenuOpenAtom: import("jotai").PrimitiveAtom<boolean> & {
    init: boolean;
};
/**
 * This component is meant to be rendered inside <Sidebar.Tab/> inside our
 * <DefaultSidebar/> or host apps Sidebar components.
 */
export declare const LibraryMenu: React.MemoExoticComponent<() => import("react/jsx-runtime").JSX.Element>;
