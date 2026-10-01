export type CaretPosition = {
    start: number;
    end: number;
};
export declare const saveCaretPosition: (ownerDocument?: Document) => CaretPosition | null;
export declare const restoreCaretPosition: (position: CaretPosition | null, ownerDocument?: Document) => void;
export declare const withCaretPositionPreservation: (callback: () => void, isCompactMode: boolean, isEditingText: boolean, onPreventClose?: () => void, ownerDocument?: Document) => void;
export declare const useTextEditorFocus: (ownerDocument?: Document) => {
    saveCaretPosition: () => void;
    restoreCaretPosition: () => void;
    clearSavedPosition: () => void;
    hasSavedPosition: boolean;
};
export declare const temporarilyDisableTextEditorBlur: (ownerDocument?: Document, duration?: number) => void;
