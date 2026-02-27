import { useMemo } from 'react';
import type { CommandPaletteItem } from '@/components/common/CommandPalette';
import { useSupermodKeyboardCommands } from '@/components/hooks/useSupermodKeyboardCommands';

const CurationKeyboardHandler = ({
  onNextPost,
  onPrevPost,
  onNextTab,
  onPrevTab,
}: {
  onNextPost: () => void;
  onPrevPost: () => void;
  onNextTab: () => void;
  onPrevTab: () => void;
}) => {
  const nextPostCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Next Post',
    keystroke: 'ArrowDown',
    isDisabled: () => false,
    execute: onNextPost,
  }), [onNextPost]);

  const previousPostCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Previous Post',
    keystroke: 'ArrowUp',
    isDisabled: () => false,
    execute: onPrevPost,
  }), [onPrevPost]);

  const nextTabCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Next Tab',
    keystroke: 'ArrowRight',
    isDisabled: () => false,
    execute: onNextTab,
  }), [onNextTab]);

  const previousTabCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Previous Tab',
    keystroke: 'ArrowLeft',
    isDisabled: () => false,
    execute: onPrevTab,
  }), [onPrevTab]);

  const escapeCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Exit Editor',
    keystroke: 'Escape',
    isDisabled: () => false,
    execute: () => (document.activeElement as HTMLElement)?.blur?.(),
  }), []);

  const commands: CommandPaletteItem[] = useMemo(() => [
    nextPostCommand,
    previousPostCommand,
    nextTabCommand,
    previousTabCommand,
    escapeCommand,
  ], [nextPostCommand, previousPostCommand, nextTabCommand, previousTabCommand, escapeCommand]);

  useSupermodKeyboardCommands({
    commands,
    handleWhileInTextInputs: ['Escape'],
    allowWithSpecialKeys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
  });

  return null;
};

export default CurationKeyboardHandler;
