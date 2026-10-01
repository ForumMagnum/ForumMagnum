import React from "react";
import "./ContextMenu.scss";
import type { ActionManager } from "../actions/manager";
import type { Action } from "../actions/types";
export type ContextMenuItem = typeof CONTEXT_MENU_SEPARATOR | Action;
export type ContextMenuItems = (ContextMenuItem | false | null | undefined)[];
type ContextMenuProps = {
    actionManager: ActionManager;
    items: ContextMenuItems;
    top: number;
    left: number;
    onClose: (callback?: () => void) => void;
};
export declare const CONTEXT_MENU_SEPARATOR = "separator";
export declare const ContextMenu: React.MemoExoticComponent<({ actionManager, items, top, left, onClose }: ContextMenuProps) => import("react/jsx-runtime").JSX.Element>;
export {};
