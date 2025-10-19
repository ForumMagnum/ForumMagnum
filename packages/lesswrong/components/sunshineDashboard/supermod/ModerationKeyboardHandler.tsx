import React, { useCallback, useMemo, useState } from 'react';
import { useGlobalKeydown } from '@/components/common/withGlobalKeydown';
import { useDialog } from '@/components/common/withDialog';
import type { CommandPaletteItem } from '@/components/common/CommandPalette';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import moment from 'moment';
import { getSignatureWithNote } from '@/lib/collections/users/helpers';
import { getNewSnoozeUntilContentCount } from '../ModeratorActions';
import SnoozeAmountModal from './SnoozeAmountModal';
import RestrictAndNotifyModal from './RestrictAndNotifyModal';
import { useCommandPalette } from '@/components/hooks/useCommandPalette';

const SunshineUsersListUpdateMutation = gql(`
  mutation updateUserModerationKeyboard($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...SunshineUsersList
      }
    }
  }
`);

const ModerationKeyboardHandler = ({
  onNextUser,
  onPrevUser,
  onOpenDetail,
  onCloseDetail,
  onNextTab,
  onPrevTab,
  selectedUser,
  currentUser,
  onActionComplete,
  isDetailView,
}: {
  onNextUser: () => void;
  onPrevUser: () => void;
  onOpenDetail: () => void;
  onCloseDetail: () => void;
  onNextTab: () => void;
  onPrevTab: () => void;
  selectedUser: SunshineUsersList | null;
  isDetailView: boolean;
  currentUser: UsersCurrent;
  onActionComplete: () => void;
}) => {
  const { openDialog } = useDialog();
  const [updateUser] = useMutation(SunshineUsersListUpdateMutation);

  const getModSignatureWithNote = useCallback(
    (note: string) => getSignatureWithNote(currentUser.displayName, note),
    [currentUser.displayName]
  );

  const handleAction = useCallback(
    async (actionFn: () => Promise<void>) => {
      onActionComplete();
      await actionFn();
    },
    [onActionComplete]
  );

  const handleReview = useCallback(() => {
    if (!selectedUser) return;
    const notes = selectedUser.sunshineNotes || '';
    const newNotes = getModSignatureWithNote('Approved') + notes;
    void handleAction(async () => {
      await updateUser({
        variables: {
          selector: { _id: selectedUser._id },
          data: {
            sunshineFlagged: false,
            reviewedByUserId: currentUser._id,
            reviewedAt: new Date(),
            needsReview: false,
            sunshineNotes: newNotes,
            snoozedUntilContentCount: null,
          },
        },
      });
    });
  }, [selectedUser, currentUser, getModSignatureWithNote, handleAction, updateUser]);

  const handleSnooze = useCallback(
    (contentCount: number) => {
      if (!selectedUser) return;
      const notes = selectedUser.sunshineNotes || '';
      const newNotes = getModSignatureWithNote(`Snooze ${contentCount}`) + notes;
      void handleAction(async () => {
        await updateUser({
          variables: {
            selector: { _id: selectedUser._id },
            data: {
              needsReview: false,
              reviewedAt: new Date(),
              reviewedByUserId: currentUser._id,
              sunshineNotes: newNotes,
              snoozedUntilContentCount: getNewSnoozeUntilContentCount(selectedUser, contentCount),
            },
          },
        });
      });
    },
    [selectedUser, currentUser, getModSignatureWithNote, handleAction, updateUser]
  );

  const handleSnoozeCustom = useCallback(() => {
    if (!selectedUser) return;
    openDialog({
      name: 'SnoozeAmountModal',
      contents: ({ onClose }) => (
        <SnoozeAmountModal
          onConfirm={(amount) => {
            handleSnooze(amount);
            onClose();
          }}
          onClose={onClose}
        />
      ),
    });
  }, [selectedUser, openDialog, handleSnooze]);

  const handleRemoveNeedsReview = useCallback(() => {
    if (!selectedUser) return;
    const notes = selectedUser.sunshineNotes || '';
    const newNotes = getModSignatureWithNote('removed from review queue without snooze/approval') + notes;
    void handleAction(async () => {
      await updateUser({
        variables: {
          selector: { _id: selectedUser._id },
          data: {
            needsReview: false,
            reviewedByUserId: null,
            reviewedAt: selectedUser.reviewedAt ? new Date() : null,
            sunshineNotes: newNotes,
          },
        },
      });
    });
  }, [selectedUser, getModSignatureWithNote, handleAction, updateUser]);

  const handleBan = useCallback(() => {
    if (!selectedUser) return;
    const banMonths = 3;
    if (!confirm(`Ban this user for ${banMonths} months?`)) return;

    const notes = selectedUser.sunshineNotes || '';
    const newNotes = getModSignatureWithNote('Ban') + notes;
    void handleAction(async () => {
      await updateUser({
        variables: {
          selector: { _id: selectedUser._id },
          data: {
            sunshineFlagged: false,
            reviewedByUserId: currentUser._id,
            needsReview: false,
            reviewedAt: new Date(),
            banned: moment().add(banMonths, 'months').toDate(),
            sunshineNotes: newNotes,
          },
        },
      });
    });
  }, [selectedUser, currentUser, getModSignatureWithNote, handleAction, updateUser]);

  const handlePurge = useCallback(() => {
    if (!selectedUser) return;
    if (!confirm("Are you sure you want to delete all this user's posts, comments, sequences, and votes?")) return;

    const notes = selectedUser.sunshineNotes || '';
    const newNotes = getModSignatureWithNote('Purge') + notes;
    void handleAction(async () => {
      await updateUser({
        variables: {
          selector: { _id: selectedUser._id },
          data: {
            sunshineFlagged: false,
            reviewedByUserId: currentUser._id,
            nullifyVotes: true,
            deleteContent: true,
            needsReview: false,
            reviewedAt: new Date(),
            banned: moment().add(1000, 'years').toDate(),
            sunshineNotes: newNotes,
          },
        },
      });
    });
  }, [selectedUser, currentUser, getModSignatureWithNote, handleAction, updateUser]);

  const handleFlag = useCallback(() => {
    if (!selectedUser) return;
    const flagStatus = selectedUser.sunshineFlagged ? 'Unflag' : 'Flag';
    const notes = selectedUser.sunshineNotes || '';
    const newNotes = getModSignatureWithNote(flagStatus) + notes;
    void updateUser({
      variables: {
        selector: { _id: selectedUser._id },
        data: {
          sunshineFlagged: !selectedUser.sunshineFlagged,
          sunshineNotes: newNotes,
        },
      },
    });
  }, [selectedUser, getModSignatureWithNote, updateUser]);

  const handleDisablePosting = useCallback(() => {
    if (!selectedUser) return;
    const abled = selectedUser.postingDisabled ? 'enabled' : 'disabled';
    const notes = selectedUser.sunshineNotes || '';
    const newNotes = getModSignatureWithNote(`publishing posts ${abled}`) + notes;
    void updateUser({
      variables: {
        selector: { _id: selectedUser._id },
        data: {
          postingDisabled: !selectedUser.postingDisabled,
          sunshineNotes: newNotes,
        },
      },
    });
  }, [selectedUser, getModSignatureWithNote, updateUser]);

  const handleDisableCommentingOnOthers = useCallback(() => {
    if (!selectedUser) return;
    const abled = selectedUser.commentingOnOtherUsersDisabled ? 'enabled' : 'disabled';
    const notes = selectedUser.sunshineNotes || '';
    const newNotes = getModSignatureWithNote(`commenting on others' content ${abled}`) + notes;
    void updateUser({
      variables: {
        selector: { _id: selectedUser._id },
        data: {
          commentingOnOtherUsersDisabled: !selectedUser.commentingOnOtherUsersDisabled,
          sunshineNotes: newNotes,
        },
      },
    });
  }, [selectedUser, getModSignatureWithNote, updateUser]);

  const handleRestrictAndNotify = useCallback(() => {
    if (!selectedUser) return;
    openDialog({
      name: 'RestrictAndNotifyModal',
      contents: ({ onClose }) => (
        <RestrictAndNotifyModal
          user={selectedUser}
          currentUser={currentUser}
          onComplete={() => {
            onActionComplete();
            onClose();
          }}
          onClose={onClose}
        />
      ),
    });
  }, [selectedUser, currentUser, openDialog, onActionComplete]);

  const openCommandPalette = useCommandPalette();

  const commands: CommandPaletteItem[] = useMemo(() => [
    {
      label: 'Approve User',
      keystroke: 'A',
      isDisabled: () => !selectedUser,
      execute: handleReview,
    },
    {
      label: 'Snooze 10',
      keystroke: 'S',
      isDisabled: () => !selectedUser,
      execute: () => handleSnooze(10),
    },
    {
      label: 'Snooze Custom Amount',
      keystroke: 'Shift+S',
      isDisabled: () => !selectedUser,
      execute: handleSnoozeCustom,
    },
    {
      label: 'Remove from Queue',
      keystroke: 'R',
      isDisabled: () => !selectedUser,
      execute: handleRemoveNeedsReview,
    },
    {
      label: 'Ban for 3 Months',
      keystroke: 'B',
      isDisabled: () => !selectedUser,
      execute: handleBan,
    },
    {
      label: 'Purge User (Delete & Ban)',
      keystroke: 'P',
      isDisabled: () => !selectedUser,
      execute: handlePurge,
    },
    {
      label: 'Toggle Flag',
      keystroke: 'F',
      isDisabled: () => !selectedUser,
      execute: handleFlag,
    },
    {
      label: 'Toggle Disable Posting',
      keystroke: 'D',
      isDisabled: () => !selectedUser,
      execute: handleDisablePosting,
    },
    {
      label: 'Toggle Disable Commenting on Others',
      keystroke: 'C',
      isDisabled: () => !selectedUser,
      execute: handleDisableCommentingOnOthers,
    },
    {
      label: 'Restrict & Notify',
      keystroke: 'Shift+R',
      isDisabled: () => !selectedUser,
      execute: handleRestrictAndNotify,
    },
    {
      label: 'Next User',
      keystroke: 'J',
      isDisabled: () => false,
      execute: onNextUser,
    },
    {
      label: 'Previous User',
      keystroke: 'K',
      isDisabled: () => false,
      execute: onPrevUser,
    },
    {
      label: 'Open Detail View',
      keystroke: 'enter',
      isDisabled: () => false,
      execute: onOpenDetail,
    },
    {
      label: 'Close Detail View',
      keystroke: 'esc',
      isDisabled: () => false,
      execute: onCloseDetail,
    },
  ], [handleReview, handleSnoozeCustom, handleRemoveNeedsReview, handleBan, handlePurge, handleFlag, handleDisablePosting, handleDisableCommentingOnOthers, handleRestrictAndNotify, onNextUser, onPrevUser, onOpenDetail, onCloseDetail, selectedUser, handleSnooze]);

  useGlobalKeydown(
    useCallback(
      (event: KeyboardEvent) => {
        // Don't handle keyboard shortcuts if user is typing in an input/textarea
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          // Exception: allow Escape and Enter even in inputs
          if (event.key !== 'Escape' && event.key !== 'Enter') {
            return;
          }
        }

        // Command palette
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
          event.preventDefault();
          openCommandPalette(commands, () => {});
          return;
        }

        // Navigation
        if (event.key === 'j' || event.key === 'ArrowDown') {
          event.preventDefault();
          onNextUser();
          return;
        }

        if (event.key === 'k' || event.key === 'ArrowUp') {
          event.preventDefault();
          onPrevUser();
          return;
        }

        // Tab navigation (only in inbox view, not detail view)
        if (event.key === 'ArrowLeft' && !isDetailView) {
          event.preventDefault();
          onPrevTab();
          return;
        }

        if (event.key === 'ArrowRight' && !isDetailView) {
          event.preventDefault();
          onNextTab();
          return;
        }

        if (event.key === 'Enter') {
          event.preventDefault();
          onOpenDetail();
          return;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          onCloseDetail();
          return;
        }

        // Action shortcuts (only if user is selected)
        if (!selectedUser) return;

        if (event.key === 'a') {
          event.preventDefault();
          handleReview();
        } else if (event.key === 's' && !event.shiftKey) {
          event.preventDefault();
          handleSnooze(10);
        } else if (event.key === 'S' && event.shiftKey) {
          event.preventDefault();
          handleSnoozeCustom();
        } else if (event.key === 'r' && !event.shiftKey) {
          event.preventDefault();
          handleRemoveNeedsReview();
        } else if (event.key === 'R' && event.shiftKey) {
          event.preventDefault();
          handleRestrictAndNotify();
        } else if (event.key === 'b') {
          event.preventDefault();
          handleBan();
        } else if (event.key === 'p') {
          event.preventDefault();
          handlePurge();
        } else if (event.key === 'f') {
          event.preventDefault();
          handleFlag();
        } else if (event.key === 'd') {
          event.preventDefault();
          handleDisablePosting();
        } else if (event.key === 'c') {
          event.preventDefault();
          handleDisableCommentingOnOthers();
        }
      },
      [
        onNextUser,
        onPrevUser,
        onNextTab,
        onPrevTab,
        onOpenDetail,
        onCloseDetail,
        isDetailView,
        selectedUser,
        handleReview,
        handleSnooze,
        handleSnoozeCustom,
        handleRemoveNeedsReview,
        handleRestrictAndNotify,
        handleBan,
        handlePurge,
        handleFlag,
        handleDisablePosting,
        handleDisableCommentingOnOthers,
        commands,
        openCommandPalette,
      ]
    )
  );

  return null;
};

export default ModerationKeyboardHandler;
