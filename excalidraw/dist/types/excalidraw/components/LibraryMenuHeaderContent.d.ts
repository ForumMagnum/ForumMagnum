import type Library from "../data/library";
import type { LibraryItem, UIAppState } from "../types";
export declare const LibraryDropdownMenuButton: React.FC<{
    setAppState: React.Component<any, UIAppState>["setState"];
    selectedItems: LibraryItem["id"][];
    library: Library;
    onRemoveFromLibrary: () => void;
    resetLibrary: () => void;
    onSelectItems: (items: LibraryItem["id"][]) => void;
    appState: UIAppState;
    className?: string;
}>;
export declare const LibraryDropdownMenu: ({ selectedItems, onSelectItems, className, }: {
    selectedItems: LibraryItem["id"][];
    onSelectItems: (id: LibraryItem["id"][]) => void;
    className?: string;
}) => import("react/jsx-runtime").JSX.Element;
