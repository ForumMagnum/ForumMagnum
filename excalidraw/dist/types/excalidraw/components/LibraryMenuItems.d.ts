import "./LibraryMenuItems.scss";
import type { ExcalidrawProps, LibraryItem, LibraryItems, UIAppState } from "../types";
export default function LibraryMenuItems({ isLoading, libraryItems, onAddToLibrary, onInsertLibraryItems, pendingElements, theme, id, libraryReturnUrl, onSelectItems, selectedItems, }: {
    isLoading: boolean;
    libraryItems: LibraryItems;
    pendingElements: LibraryItem["elements"];
    onInsertLibraryItems: (libraryItems: LibraryItems) => void;
    onAddToLibrary: (elements: LibraryItem["elements"]) => void;
    libraryReturnUrl: ExcalidrawProps["libraryReturnUrl"];
    theme: UIAppState["theme"];
    id: string;
    selectedItems: LibraryItem["id"][];
    onSelectItems: (id: LibraryItem["id"][]) => void;
}): import("react/jsx-runtime").JSX.Element;
