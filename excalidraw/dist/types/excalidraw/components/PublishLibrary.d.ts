import "./PublishLibrary.scss";
import type { LibraryItems, UIAppState } from "../types";
declare const PublishLibrary: ({ onClose, libraryItems, appState, onSuccess, onError, updateItemsInStorage, onRemove, }: {
    onClose: () => void;
    libraryItems: LibraryItems;
    appState: UIAppState;
    onSuccess: (data: {
        url: string;
        authorName: string;
        items: LibraryItems;
    }) => void;
    onError: (error: Error) => void;
    updateItemsInStorage: (items: LibraryItems) => void;
    onRemove: (id: string) => void;
}) => import("react/jsx-runtime").JSX.Element;
export default PublishLibrary;
