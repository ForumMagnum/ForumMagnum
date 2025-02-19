import { useEffect } from "react";
import type { Editor } from "@ckeditor/ckeditor5-core";

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
