import React, { useMemo } from 'react';
import type { CommandPaletteItem } from '@/components/common/CommandPalette';
import { useSupermodKeyboardCommands } from '@/components/hooks/useSupermodKeyboardCommands';
import type { InboxAction } from './inboxReducer';
import { useReportActions } from './useReportActions';

const ModerationReportKeyboardHandler = ({
  onNextReport,
  onPrevReport,
  onNextTab,
  onPrevTab,
  selectedReport,
  currentUser,
  dispatch,
}: {
  onNextReport: () => void;
  onPrevReport: () => void;
  onNextTab: () => void;
  onPrevTab: () => void;
  selectedReport: UnclaimedReportsList | null;
  currentUser: UsersCurrent;
  dispatch: React.Dispatch<InboxAction>;
}) => {
  const { markAsReviewed, deleteContent } = useReportActions(selectedReport, currentUser, dispatch);

  const markAsReviewedCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Mark as Reviewed',
    keystroke: 'R',
    isDisabled: () => !selectedReport,
    execute: markAsReviewed,
  }), [selectedReport, markAsReviewed]);

  const deleteContentCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Delete Content (Spam)',
    keystroke: 'D',
    isDisabled: () => !selectedReport?.comment && !selectedReport?.post,
    execute: deleteContent,
  }), [selectedReport, deleteContent]);

  const nextReportCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Next Report',
    keystroke: 'ArrowDown',
    isDisabled: () => false,
    execute: onNextReport,
  }), [onNextReport]);

  const previousReportCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Previous Report',
    keystroke: 'ArrowUp',
    isDisabled: () => false,
    execute: onPrevReport,
  }), [onPrevReport]);

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
    markAsReviewedCommand,
    deleteContentCommand,
    nextReportCommand,
    previousReportCommand,
    nextTabCommand,
    previousTabCommand,
  ], [
    markAsReviewedCommand,
    deleteContentCommand,
    nextReportCommand,
    previousReportCommand,
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

export default ModerationReportKeyboardHandler;
