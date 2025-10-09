import React, { useCallback } from "react";
import CommandPalette, { CommandPaletteItem } from "../common/CommandPalette";
import { useDialog } from "../common/withDialog";

export function useCommandPalette() {
  const { openDialog } = useDialog();

  const openCommandPalette = useCallback((commands: CommandPaletteItem[], onCommandPaletteClosed: () => void) => {
    openDialog({
      name: "CommandPalette",
      contents: ({onClose}) => <CommandPalette
        commands={commands}
        onClose={() => {
          onCommandPaletteClosed();
          onClose();
        }}
      />
    });
  }, [openDialog]);

  return openCommandPalette;
}
