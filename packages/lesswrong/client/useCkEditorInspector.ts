import { RefObject } from "react";
import { useGlobalKeydown } from "@/components/common/withGlobalKeydown";
import type CKEditor from "@/lib/vendor/ckeditor5-react/ckeditor";

export function useCkEditorInspector(editorRef: RefObject<CKEditor<any>|null>) {
  useGlobalKeydown(ev => {
    if (bundleIsProduction || bundleIsTest) {
      return;
    }
    if (editorRef.current?.editor && ev.key === 'D' && ev.ctrlKey && ev.shiftKey) {
      //eslint-disable-next-line no-console
      console.log("Attaching CkEditor inspector");
      const CKEditorInspector = require("@ckeditor/ckeditor5-inspector");
      CKEditorInspector.attach(editorRef.current?.editor);
    }
  });
}
