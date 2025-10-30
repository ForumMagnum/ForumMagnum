import React, { useMemo } from 'react';
import type { CommandPaletteItem } from '@/components/common/CommandPalette';
import { useSupermodKeyboardCommands } from '@/components/hooks/useSupermodKeyboardCommands';
import type { InboxAction } from './inboxReducer';
import { usePostReviewActions } from './usePostReviewActions';
import { useCoreTagsKeyboard } from '@/components/tagging/CoreTagsKeyboardContext';

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

  const coreTagsContext = useCoreTagsKeyboard();
  const existingTagIds = useMemo(() => (
    (selectedPost?.tagRels ?? [])
      .filter(tr => tr.baseScore > 0)
      .map(tr => tr.tag)
      .filter(t => !!t)
      .map(t => t._id)
  ), [selectedPost]);

  const coreTagCommands: CommandPaletteItem[] = useMemo(() => {
    if (!coreTagsContext?.coreTagsWithShortcuts || !coreTagsContext.onTagSelected || !coreTagsContext.onTagRemoved) {
      return [];
    }

    return coreTagsContext.coreTagsWithShortcuts.map(({ tagId, tagName, shortcut }) => ({
      label: existingTagIds.includes(tagId) ? `Remove ${tagName}` : `Add ${tagName}`,
      keystroke: shortcut,
      isDisabled: () => !selectedPost,
      execute: async () => {
        if (!selectedPost) return;
        
        const isCurrentlyApplied = existingTagIds.includes(tagId);
        if (isCurrentlyApplied) {
          await coreTagsContext.onTagRemoved?.({ tagId, tagName }, existingTagIds);
        } else {
          await coreTagsContext.onTagSelected?.({ tagId, tagName }, existingTagIds);
        }
      },
    }));
  }, [coreTagsContext, existingTagIds, selectedPost]);

  const commands: CommandPaletteItem[] = useMemo(() => [
    markAsPersonalCommand,
    markAsFrontpageCommand,
    moveToDraftCommand,
    flagUserCommand,
    nextPostCommand,
    previousPostCommand,
    nextTabCommand,
    previousTabCommand,
    ...coreTagCommands,
  ], [
    markAsPersonalCommand,
    markAsFrontpageCommand,
    moveToDraftCommand,
    flagUserCommand,
    nextPostCommand,
    previousPostCommand,
    nextTabCommand,
    previousTabCommand,
    coreTagCommands,
  ]);

  useSupermodKeyboardCommands({
    commands,
    handleWhileInTextInputs: [],
    allowWithSpecialKeys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
  });

  return null;
};

export default ModerationPostKeyboardHandler;

