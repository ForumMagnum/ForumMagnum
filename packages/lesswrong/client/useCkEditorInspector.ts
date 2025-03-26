import { RefObject } from "react";
import { useGlobalKeydown } from "@/components/common/withGlobalKeydown";
import CKEditorInspector from "@ckeditor/ckeditor5-inspector";
import type CKEditor from "@/lib/vendor/ckeditor5-react/ckeditor";

export function useCkEditorInspector(editorRef: RefObject<CKEditor<any>>) {
  useGlobalKeydown(ev => {
    if (bundleIsProduction) {
      return;
    }
    if (editorRef.current?.editor && ev.key === 'D' && ev.ctrlKey && ev.shiftKey) {
      //eslint-disable-next-line no-console
      console.log("Attaching CkEditor inspector");
      CKEditorInspector.attach(editorRef.current?.editor);
    } else if (editorRef.current?.editor) {
      console.log(`Not attaching to CkEditor: key=${ev.key}`);
    } else {
      console.log("Not attaching to CkEditor: Editor not ready");
    }
  });
}
