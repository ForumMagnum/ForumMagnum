import React from "react";
import type { ExcalidrawElement, NonDeleted } from "../../element/src/types";
import type { SvgCache } from "../hooks/useLibraryItemSvg";
import type { LibraryItem } from "../types";
import type { ReactNode } from "react";
type LibraryOrPendingItem = readonly (LibraryItem | /* pending library item */ {
    id: null;
    elements: readonly NonDeleted<ExcalidrawElement>[];
})[];
interface Props {
    items: LibraryOrPendingItem;
    onClick: (id: LibraryItem["id"] | null) => void;
    onItemSelectToggle: (id: LibraryItem["id"], event: React.MouseEvent) => void;
    onItemDrag: (id: LibraryItem["id"], event: React.DragEvent) => void;
    isItemSelected: (id: LibraryItem["id"] | null) => boolean;
    svgCache: SvgCache;
    itemsRenderedPerBatch: number;
    /** larger items with their name below */
    showNames?: boolean;
}
export declare const LibraryMenuSectionGrid: ({ children, showNames, }: {
    children: ReactNode;
    /** fewer columns, for items rendered with `showNames` */
    showNames?: boolean;
}) => import("react/jsx-runtime").JSX.Element;
export declare const LibraryMenuSection: React.MemoExoticComponent<({ items, onItemSelectToggle, onItemDrag, isItemSelected, onClick, svgCache, itemsRenderedPerBatch, showNames, }: Props) => import("react/jsx-runtime").JSX.Element>;
export {};
