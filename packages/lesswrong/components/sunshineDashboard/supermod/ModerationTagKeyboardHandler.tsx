import React, { useMemo } from 'react';
import type { CommandPaletteItem } from '@/components/common/CommandPalette';
import { useSupermodKeyboardCommands } from '@/components/hooks/useSupermodKeyboardCommands';
import type { InboxAction } from './inboxReducer';
import { useTagReviewActions } from './useTagReviewActions';

const ModerationTagKeyboardHandler = ({
  onNextTag,
  onPrevTag,
  onNextTab,
  onPrevTab,
  selectedTag,
  currentUser,
  dispatch,
}: {
  onNextTag: () => void;
  onPrevTag: () => void;
  onNextTab: () => void;
  onPrevTab: () => void;
  selectedTag: SunshineTagFragment | null;
  currentUser: UsersCurrent;
  dispatch: React.Dispatch<InboxAction>;
}) => {
  const { approveTag, deleteTag } = useTagReviewActions(selectedTag, currentUser, dispatch);

  const approveCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Approve Wikitag',
    keystroke: 'A',
    isDisabled: () => !selectedTag,
    execute: approveTag,
  }), [selectedTag, approveTag]);

  const deleteCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Delete Wikitag',
    keystroke: 'D',
    isDisabled: () => !selectedTag,
    execute: deleteTag,
  }), [selectedTag, deleteTag]);

  const nextTagCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Next Wikitag',
    keystroke: 'ArrowDown',
    isDisabled: () => false,
    execute: onNextTag,
  }), [onNextTag]);

  const previousTagCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Previous Wikitag',
    keystroke: 'ArrowUp',
    isDisabled: () => false,
    execute: onPrevTag,
  }), [onPrevTag]);

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

  const commands: CommandPaletteItem[] = useMemo(() => [
    approveCommand,
    deleteCommand,
    nextTagCommand,
    previousTagCommand,
    nextTabCommand,
    previousTabCommand,
  ], [
    approveCommand,
    deleteCommand,
    nextTagCommand,
    previousTagCommand,
    nextTabCommand,
    previousTabCommand,
  ]);

  useSupermodKeyboardCommands({
    commands,
    handleWhileInTextInputs: [],
    allowWithSpecialKeys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
  });

  return null;
};

export default ModerationTagKeyboardHandler;
