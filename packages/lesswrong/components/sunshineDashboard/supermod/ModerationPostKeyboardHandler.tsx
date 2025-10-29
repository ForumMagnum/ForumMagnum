import React, { useCallback, useMemo } from 'react';
import { useGlobalKeydown } from '@/components/common/withGlobalKeydown';
import { useDialog } from '@/components/common/withDialog';
import type { CommandPaletteItem } from '@/components/common/CommandPalette';
import { useCommandPalette } from '@/components/hooks/useCommandPalette';
import type { InboxAction } from './inboxReducer';
import { usePostReviewActions } from './usePostReviewActions';
import { parseKeystroke, getCode } from '@/lib/vendor/ckeditor5-util/keyboard';

function specialKeyPressed(event: KeyboardEvent) {
  return event.metaKey || event.ctrlKey || event.altKey;
}

function isNavigationKey(key: string) {
  return key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight';
}

function matchesKeystroke(event: KeyboardEvent, keystroke: string): boolean {
  const key = event.key;

  if (isNavigationKey(key)) {
    const normalizedKeystroke = keystroke.toLowerCase();
    const normalizedKey = key.toLowerCase();
    return normalizedKeystroke === normalizedKey;
  }

  try {
    const keystrokeCode = parseKeystroke(keystroke);
    const eventCode = getCode(event);
    return keystrokeCode === eventCode;
  } catch (error) {
    return false;
  }
}

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
  const { isDialogOpen } = useDialog();
  
  const { markAsPersonal, markAsFrontpage, moveToDraft, flagUser } = usePostReviewActions(
    selectedPost,
    currentUser,
    dispatch
  );

  const openCommandPalette = useCommandPalette({ large: true, hideDisabledCommands: true });

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

  useGlobalKeydown(
    useCallback(
      (event: KeyboardEvent) => {
        // Don't trigger any shortcuts if a dialog is open
        if (isDialogOpen) {
          return;
        }

        // Don't handle keyboard shortcuts if user is typing in an input/textarea
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }

        // Open command palette
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
          event.preventDefault();
          openCommandPalette(commands, () => {});
          return;
        }

        // Block shortcuts when special keys are pressed, except for navigation
        if (specialKeyPressed(event) && !isNavigationKey(event.key)) {
          return;
        }

        // Try to match and execute commands
        for (const command of commands) {
          if (matchesKeystroke(event, command.keystroke)) {
            if (command.isDisabled()) {
              return;
            }

            event.preventDefault();
            command.execute();
            return;
          }
        }
      },
      [commands, openCommandPalette, isDialogOpen]
    )
  );

  return null;
};

export default ModerationPostKeyboardHandler;

