import React, { useMemo } from 'react';
import type { CommandPaletteItem } from '@/components/common/CommandPalette';
import { useSupermodKeyboardCommands } from '@/components/hooks/useSupermodKeyboardCommands';
import type { InboxAction } from './inboxReducer';
import { usePostReviewActions } from './usePostReviewActions';

const ModerationPostKeyboardHandler = ({
  onNextPost,
  onPrevPost,
  onNextTab,
  onPrevTab,
  selectedPost,
  currentUser,
  dispatch,
}: {
  onNextPost: () => void;
  onPrevPost: () => void;
  onNextTab: () => void;
  onPrevTab: () => void;
  selectedPost: SunshinePostsList | null;
  currentUser: UsersCurrent;
  dispatch: React.Dispatch<InboxAction>;
}) => {
  const { markAsPersonal, markAsFrontpage, moveToDraft, flagUser } = usePostReviewActions(
    selectedPost,
    currentUser,
    dispatch
  );

  const markAsPersonalCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Mark as Personal',
    keystroke: 'P',
    isDisabled: () => !selectedPost,
    execute: markAsPersonal,
  }), [selectedPost, markAsPersonal]);

  const markAsFrontpageCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Mark as Frontpage',
    keystroke: 'F',
    isDisabled: () => !selectedPost || !selectedPost.submitToFrontpage,
    execute: markAsFrontpage,
  }), [selectedPost, markAsFrontpage]);

  const moveToDraftCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Move to Draft',
    keystroke: 'D',
    isDisabled: () => !selectedPost,
    execute: moveToDraft,
  }), [selectedPost, moveToDraft]);

  const flagUserCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Flag User',
    keystroke: 'U',
    isDisabled: () => {
      if (!selectedPost?.user) return true;
      return !!selectedPost.user.needsReview;
    },
    execute: flagUser,
  }), [selectedPost, flagUser]);

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

  const commands: CommandPaletteItem[] = useMemo(() => [
    markAsPersonalCommand,
    markAsFrontpageCommand,
    moveToDraftCommand,
    flagUserCommand,
    nextPostCommand,
    previousPostCommand,
    nextTabCommand,
    previousTabCommand,
  ], [
    markAsPersonalCommand,
    markAsFrontpageCommand,
    moveToDraftCommand,
    flagUserCommand,
    nextPostCommand,
    previousPostCommand,
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

export default ModerationPostKeyboardHandler;

