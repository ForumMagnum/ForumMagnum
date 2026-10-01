import "./LibraryUnit.scss";
import type { LibraryItem } from "../types";
import type { SvgCache } from "../hooks/useLibraryItemSvg";
export declare const LibraryUnit: import("react").MemoExoticComponent<({ id, name, showName, elements, isPending, onClick, selected, onToggle, onDrag, svgCache, }: {
    id: LibraryItem["id"] | /** for pending item */ null;
    name?: LibraryItem["name"];
    /** render larger, with the name below the item */
    showName?: boolean;
    elements?: LibraryItem["elements"];
    isPending?: boolean;
    onClick: (id: LibraryItem["id"] | null) => void;
    selected: boolean;
    onToggle: (id: string, event: React.MouseEvent) => void;
    onDrag: (id: string, event: React.DragEvent) => void;
    svgCache: SvgCache;
}) => import("react/jsx-runtime").JSX.Element>;
export declare const EmptyLibraryUnit: ({ showName }: {
    showName?: boolean;
}) => import("react/jsx-runtime").JSX.Element;
