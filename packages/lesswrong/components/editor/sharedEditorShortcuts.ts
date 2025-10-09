import type CKEditor from "@/lib/vendor/ckeditor5-react/ckeditor";
import type { Command, Editor } from "@ckeditor/ckeditor5-core";
import type { RefObject } from "react";

export interface CkEditorShortcut {
  keystroke: string;
  label: string;
  /**
   * Some keybindings aren't linked to ckEditor "Commands", just to arbitrary plugin-related logic.
   * An example is CTRL+4 for LaTeX - it displays the math input element, but the actual "Command"
   * is for inserting LaTeX into the document after it's been put into the input element, which
   * doesn't make any sense to try to execute as an isolated command in this context.
   */
  commandName?: string;
  disabledHelperText?: string;
}

interface CkEditorCommandShortcut extends CkEditorShortcut {
  commandName: string;
}

const ckEditorCommandShortcuts: CkEditorShortcut[] = [{
  // Unfortunately this collide's with Chrome's "Search the web" shortcut on macos,
  // but Google Docs hijacks it for setting a footnote, and if they can do it so can we.
  keystroke: 'CTRL+ALT+F',
  commandName: 'InsertFootnote',
  label: 'Insert Footnote',
}, {
  keystroke: 'CTRL+ALT+S',
  commandName: 'insertCollapsibleSection',
  label: 'Insert Collapsible Section',
}, {
  keystroke: 'CTRL+4',
  label: 'Insert LaTeX (inline)',
}, {
  keystroke: 'CTRL+M',
  label: 'Insert LaTeX (display)',
}, {
  keystroke: '`+`+`',
  commandName: 'codeBlock',
  label: 'Insert Code Block',
}, {
  keystroke: 'CTRL+ALT+V',
  commandName: 'insertClaim',
  label: 'Insert Claim/Prediction',
}];

interface CommandWithKeystroke {
  keystroke: string;
  label: string;
  command?: Command;
  disabledHelperText?: string;
}

export function addSharedEditorShortcuts(
  editorElementRef: RefObject<CKEditor<AnyBecauseHard> | null>,
  editorInstance: Editor,
  openCommandPalette: (commands: CommandWithKeystroke[], editorInstance: Editor, onClose: () => void) => void,
  additionalShortcuts: CkEditorShortcut[] = []
) {
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

  const allShortcuts = [...ckEditorCommandShortcuts, ...additionalShortcuts];
  const shortcutsWithCommands = allShortcuts.filter((shortcut): shortcut is CkEditorCommandShortcut => shortcut.commandName !== undefined);

  for (const shortcut of shortcutsWithCommands) {
    if (editorInstance.commands.get(shortcut.commandName)) {
      continue;
    }

    editorInstance.keystrokes.set(shortcut.keystroke, (e) => {
      e.preventDefault();
      editorInstance.execute(shortcut.commandName);
    });
  }

  editorInstance.accessibility.addKeystrokeInfoGroup({
    categoryId: 'contentEditing',
    id: 'custom',
    label: 'Custom',
    keystrokes: allShortcuts.map(shortcut => ({
      keystroke: shortcut.keystroke,
      label: shortcut.label,
    })),
  });

  // Build command palette data by combining keystroke info with commands
  if (openCommandPalette) {
    const commandsWithKeystrokes: CommandWithKeystroke[] = [];
    
    // Get all keystroke info groups from the editor
    const keystrokeInfos = editorInstance.accessibility.keystrokeInfos;
    
    // Iterate through all categories and groups to collect keystroke info
    for (const [categoryId, category] of keystrokeInfos) {
      for (const [groupId, group] of category.groups) {
        for (const keystrokeInfo of group.keystrokes) {
          // TODO: refactor everything downstream to accept string | string[] instead(?)
          // keystroke can be a string or nested arrays, normalize to string
          let keystrokeStr = keystrokeInfo.keystroke;
          while (Array.isArray(keystrokeStr)) {
            keystrokeStr = keystrokeStr[0];
          }
          
          // Try to find a matching command from our custom shortcuts
          const matchingShortcut = allShortcuts.find(
            s => s.keystroke === keystrokeStr
          );
          
          if (matchingShortcut) {
            if (matchingShortcut.commandName) {
              const command = editorInstance.commands.get(matchingShortcut.commandName);
              commandsWithKeystrokes.push({
                keystroke: keystrokeStr,
                label: keystrokeInfo.label,
                command,
                disabledHelperText: matchingShortcut.disabledHelperText,
              });
            } else {
              commandsWithKeystrokes.push({
                keystroke: keystrokeStr,
                label: keystrokeInfo.label,
                disabledHelperText: matchingShortcut.disabledHelperText,
              });
            }
          }
        }
      }
    }
    
    // Show the command palette.
    editorInstance.keystrokes.set('CTRL+SHIFT+P', (e) => {
      e.preventDefault();

      // Refocus the editor when the command palette is closed.
      const onClose = () => {
        editorInstance.editing.view.focus();
      };

      openCommandPalette(commandsWithKeystrokes, editorInstance, onClose);
    });
  }
}
