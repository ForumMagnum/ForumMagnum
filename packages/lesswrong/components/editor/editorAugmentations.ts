import type CKEditor from "@/lib/vendor/ckeditor5-react/ckeditor";
import type { Editor } from "@ckeditor/ckeditor5-core";
import type { RefObject } from "react";
import type { CommandPaletteItem } from "../common/CommandPalette";
import { KeystrokeInfo, parseKeystroke } from "@/lib/vendor/ckeditor5-util/keyboard";
import { captureException } from "@/lib/sentryWrapper";

interface CkEditorShortcutBase {
  keystroke: string;
  label: string;
  disabledHelperText?: string;
}

type CkEditorCommandShortcut = CkEditorShortcutBase & {
  commandName: string;
  /**
   * Some keystroke combinations are already registered elsewhere, like in a plugin.
   * In those cases, we still want to add them to the accessibility info and create
   * command palette items for them, but we don't want to register them a second time.
   * Other times, we're adding a command palette item for something that doesn't fit
   * the mold of a traditional keybinding, like triple-backtick for creating a code block.
   * We wouldn't be able to meaningfully register a keystroke handler for them, and
   * they're also just handled by default.
   */
  skipKeystrokeRegistration?: true;
};

/**
 * Some keybindings aren't linked to ckEditor "Commands", just to arbitrary plugin-related logic.
 * An example is CTRL+4 for LaTeX - it displays the math input element, but the actual "Command"
 * is for inserting LaTeX into the document after it's been put into the input element, which
 * doesn't make any sense to try to execute as an isolated command in this context.
 */
type CkEditorKeystrokeShortcut = CkEditorShortcutBase & {
  commandName?: undefined;
  skipKeystrokeRegistration?: undefined;
};

export type CkEditorShortcut = CkEditorCommandShortcut | CkEditorKeystrokeShortcut;

const ckEditorCommandShortcuts: CkEditorShortcut[] = [{
  // Unfortunately this collide's with Chrome's "Search the web" shortcut on macos,
  // but Google Docs hijacks it for setting a footnote, and if they can do it so can we.
  keystroke: 'CTRL+ALT+F',
  commandName: 'InsertFootnote',
  label: 'Footnote',
}, {
  keystroke: 'CTRL+ALT+S',
  commandName: 'insertCollapsibleSection',
  label: 'Collapsible Section',
}, {
  keystroke: 'CTRL+4',
  label: 'LaTeX (inline)',
}, {
  keystroke: 'CTRL+M',
  label: 'LaTeX (display)',
}, {
  keystroke: '`+`+`',
  commandName: 'codeBlock',
  label: 'Code Block',
  skipKeystrokeRegistration: true,
}, {
  keystroke: 'CTRL+ALT+V',
  commandName: 'insertClaim',
  label: 'Claim/Prediction',
}];

function convertKeystrokeToKeystrokeInfo(keystroke: string): KeystrokeInfo {
  const normalizedKeystrokeParts = keystroke.split('+').map(part => part.trim());
  return {
    keyCode: parseKeystroke(normalizedKeystrokeParts),
    altKey: normalizedKeystrokeParts.includes('alt'),
    metaKey: normalizedKeystrokeParts.includes('meta'),
    ctrlKey: normalizedKeystrokeParts.includes('ctrl'),
    shiftKey: normalizedKeystrokeParts.includes('shift'),
    // If these aren't wrapped in an object spread, we get a type error because they aren't part
    // of the KeystrokeInfo interface.  However, keystroke callback handlers receive a `cancel` function
    // which it turns out expects keystrokes to have been triggered by a keyboard event that contains
    // these properties.  So we pass them along because we call editor.keystrokes.press manually sometimes.
    ...({
      preventDefault: () => {},
      stopPropagation: () => {},
    })
  };
}

/**
 * Prevent the user from accidentally highlighting text when right-clicking in the editor,
 * stop the native browser context menu from showing up, and open the editor toolbar.
 */
export function improveEditorContextMenu(
  editorElementRef: RefObject<CKEditor<AnyBecauseHard> | null>,
  editorInstance: Editor
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
      // This line errors in CI environments because they won't necessarily have the types from ckEditor installed,
      // which include plugin augmentations that tell us the BalloonEditor plugin has a `show` method (unlike other plugins).
      // @ts-ignore
      toolbar.show(true);
    }, 0);
  });
}

export function getEditorPaletteItems(
  editorInstance: Editor,
  additionalShortcuts: CkEditorShortcut[] = []
) {
  const allShortcuts = [...ckEditorCommandShortcuts, ...additionalShortcuts];
  const shortcutsWithCommands = allShortcuts.filter((shortcut) => shortcut.commandName !== undefined);

  // For registered ckEditor Commands where we haven't already done so elsewhere,
  // register the appropriate keystroke handler for them.
  // Unfortunately there doesn't seem to be a way to check what keystroke combos
  // have already been registered on an editor instance, so we need to manually
  // specify it in the shortcut definition.
  for (const shortcut of shortcutsWithCommands) {
    if (shortcut.skipKeystrokeRegistration) {
      continue;
    }

    editorInstance.keystrokes.set(shortcut.keystroke, (e) => {
      e.preventDefault();
      editorInstance.execute(shortcut.commandName);
    });
  }

  // Add everything that we're putting into the command palette into the accessibility infobox.
  editorInstance.accessibility.addKeystrokeInfoGroup({
    categoryId: 'contentEditing',
    id: 'custom',
    label: 'Custom',
    keystrokes: allShortcuts.map(shortcut => ({
      keystroke: shortcut.keystroke,
      label: shortcut.label,
    })),
  });

  const paletteItems: CommandPaletteItem[] = [];

  for (const shortcut of allShortcuts) {
    const { keystroke, label, disabledHelperText } = shortcut;

    const sharedPaletteItemProps = {
      keystroke: keystroke,
      label: label,
      disabledHelperText: disabledHelperText,
    };

    if (shortcut.commandName) {
      const command = editorInstance.commands.get(shortcut.commandName);
      if (command) {
        paletteItems.push({
          ...sharedPaletteItemProps,
          isDisabled: () => !!command && !command.isEnabled,
          execute: () => command.execute(),
        });
      } else {
        captureException(new Error(`Command ${shortcut.commandName} not found in editor instance when getting editor palette items`));
      }
    } else {
      paletteItems.push({
        ...sharedPaletteItemProps,
        isDisabled: () => false,
        execute: () => {
          const keystrokeInfo = convertKeystrokeToKeystrokeInfo(keystroke);
          editorInstance.keystrokes.press(keystrokeInfo);
        },
      });
    }
  }

  return paletteItems;
}
