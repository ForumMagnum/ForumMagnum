import type CKEditor from "@/lib/vendor/ckeditor5-react/ckeditor";
import type { Command, Editor } from "@ckeditor/ckeditor5-core";
import type { RefObject } from "react";

interface CkEditorCommandShortcut {
  keystroke: string;
  commandName: string;
  label: string;
}

const ckEditorCommandShortcuts = [{
  // Unfortunately this collide's with Chrome's "Search the web" shortcut on macos,
  // but Google Docs hijacks it for setting a footnote, and if they can do it so can we.
  keystroke: 'CTRL+ALT+F',
  commandName: 'InsertFootnote',
  label: 'Insert Footnote',
}] satisfies CkEditorCommandShortcut[];

export function addSharedEditorShortcuts(editorElementRef: RefObject<CKEditor<AnyBecauseHard> | null>, editorInstance: Editor, openCommandPalette?: (commandsByName: Record<string, Command>) => void) {
  (editorElementRef.current as AnyBecauseHard)?.domContainer?.current?.addEventListener('contextmenu', (event: MouseEvent) => {
    event.preventDefault();
    const toolbar = editorInstance.plugins.get('BalloonToolbar');
    if (!toolbar) return;
    // If the user right-clicks on an element in the editor which causes their cursor position (i.e. "selection", in ckEditor parlance) to change,
    // then without the setTimeout the toolbar won't show up.  (Probably it does show up briefly, and then the toolbar internals see that the selection
    // has changed in a way which would normally close an already-empty toolbar, and then it gets closed.)
    // In practice simply letting the event loop run a tick seems to be sufficient to let the selection change get processed before opening the toolbar,
    // but if we get complains about inconsistent behavior we could set it to 10ms or something.
    setTimeout(() => {
      toolbar.show(true);
    }, 0);
  });

  for (const shortcut of ckEditorCommandShortcuts) {
    editorInstance.keystrokes.set(shortcut.keystroke, (e) => {
      e.preventDefault();
      editorInstance.execute(shortcut.commandName);
    });
  }

  editorInstance.accessibility.addKeystrokeInfoGroup({
    categoryId: 'contentEditing',
    id: 'custom',
    label: 'Custom',
    keystrokes: ckEditorCommandShortcuts.map(shortcut => ({
      keystroke: shortcut.keystroke,
      label: shortcut.label,
    })),
  });

  const customKeystrokes = editorInstance.accessibility.keystrokeInfos.get('contentEditing')?.groups.get('custom')?.keystrokes;

  const commandsByName = [...editorInstance.commands.names()].reduce((acc, name) => {
    const command = editorInstance.commands.get(name);
    if (!command?.isEnabled) return acc;
    acc[name] = command;
    return acc;
  }, {} as Record<string, Command>);

  // Show the command palette.
  openCommandPalette && editorInstance.keystrokes.set('CTRL+SHIFT+P', (e) => {
    e.preventDefault();
    openCommandPalette(commandsByName);
  });
}
