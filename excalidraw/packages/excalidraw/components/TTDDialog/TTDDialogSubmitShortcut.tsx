// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import { getShortcutKey } from "../../shortcut";

export const TTDDialogSubmitShortcut = () => {
  return (
    <div className="ttd-dialog-submit-shortcut">
      <div className="ttd-dialog-submit-shortcut__key">
        {getShortcutKey("CtrlOrCmd")}
      </div>
      <div className="ttd-dialog-submit-shortcut__key">
        {getShortcutKey("Enter")}
      </div>
    </div>
  );
};
