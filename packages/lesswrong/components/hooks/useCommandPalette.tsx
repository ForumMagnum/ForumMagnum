import React, { useCallback } from "react";
import CommandPalette, { CommandPaletteItem } from "../common/CommandPalette";
import { useDialog } from "../common/withDialog";

interface CommandPaletteOptions {
  /**
   * If true, the command palette will be about twice as tall and show more items
   */
  large?: boolean;

  /**
   * If true, disabled commands will not be shown in the command palette
   */
  hideDisabledCommands?: boolean;
}

export function useCommandPalette({ large, hideDisabledCommands }: CommandPaletteOptions = {}) {
  const { openDialog } = useDialog();

  const openCommandPalette = useCallback((commands: CommandPaletteItem[], onCommandPaletteClosed: () => void) => {
    openDialog({
      name: "CommandPalette",
      contents: ({onClose}) => <CommandPalette
        commands={commands}
        large={large}
        hideDisabledCommands={hideDisabledCommands}
        onClose={() => {
          onCommandPaletteClosed();
          onClose();
        }}
      />
    });
  }, [openDialog, large]);

  return openCommandPalette;
}
