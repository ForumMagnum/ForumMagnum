import { useEffect } from "react";
import type { Editor } from 'ckeditor5';

export const useSyncCkEditorPlaceholder = (
  editor: Editor | null,
  placeholder: string,
) => {
  useEffect(() => {
    const root = editor?.editing.view.document.getRoot("main");
    if (root) {
      root.placeholder = placeholder;
    }
  }, [editor, placeholder]);
}
