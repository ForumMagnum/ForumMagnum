import { useCallback } from 'react';
import { useGlobalKeydown } from '@/components/common/withGlobalKeydown';
import { parseKeystroke, getCode } from '@/lib/vendor/ckeditor5-util/keyboard';
import type { CommandPaletteItem } from '@/components/common/CommandPalette';
import { useDialog } from '../common/withDialog';
import { useCommandPalette } from './useCommandPalette';

function specialKeyPressed(event: KeyboardEvent) {
  return event.metaKey || event.ctrlKey || event.altKey;
}

function matchesKeystroke(event: KeyboardEvent, keystroke: string, allowWithSpecialKeys: string[]): boolean {
  const key = event.key;

  // Check if this is a key that's allowed with special keys
  if (allowWithSpecialKeys.includes(key)) {
    const normalizedKeystroke = keystroke.toLowerCase();
    const normalizedKey = key.toLowerCase();
    return normalizedKeystroke === normalizedKey;
  }

  // Special case for Escape
  if (key === 'Escape') {
    return keystroke === 'esc';
  }

  try {
    const keystrokeCode = parseKeystroke(keystroke);
    const eventCode = getCode(event);
    return keystrokeCode === eventCode;
  } catch (error) {
    return false;
  }
}

interface UseSupermodKeyboardCommandsOptions {
  commands: CommandPaletteItem[];
  handleWhileInTextInputs?: string[];
  allowWithSpecialKeys?: string[];
}

export function useSupermodKeyboardCommands({
  commands,
  handleWhileInTextInputs = [],
  allowWithSpecialKeys = [],
}: UseSupermodKeyboardCommandsOptions) {
  const { isDialogOpen } = useDialog();
  const openCommandPalette = useCommandPalette({ large: true, hideDisabledCommands: true });

  useGlobalKeydown(
    useCallback(
      (event: KeyboardEvent) => {
        // Don't trigger any shortcuts if a dialog is open
        if (isDialogOpen) {
          return;
        }

        // Don't handle keyboard shortcuts if user is typing in an input/textarea
        const target = event.target as HTMLElement;
        const isInTextInput = (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        );

        if (isInTextInput) {
          // "Handle" specific keys even in text inputs (e.g., Escape)
          if (!handleWhileInTextInputs.includes(event.key)) {
            return;
          }
        }

        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
          event.preventDefault();
          openCommandPalette(commands, () => {});
          return;
        }

        // Block shortcuts when special keys are pressed, except for allowed keys
        if (specialKeyPressed(event) && !allowWithSpecialKeys.includes(event.key)) {
          return;
        }

        // Try to match and execute commands
        for (const command of commands) {
          if (matchesKeystroke(event, command.keystroke, allowWithSpecialKeys)) {
            if (command.isDisabled()) {
              return;
            }

            event.preventDefault();
            command.execute();
            return;
          }
        }
      },
      [commands, openCommandPalette, isDialogOpen, handleWhileInTextInputs, allowWithSpecialKeys]
    )
  );
}

