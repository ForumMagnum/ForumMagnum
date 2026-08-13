import React, { useCallback, useMemo } from 'react';
import moment from 'moment';
import { useDialog } from '@/components/common/withDialog';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { getSignatureWithNote } from '@/lib/collections/users/helpers';
import { getNewSnoozeUntilContentCount } from '../ModeratorActions';
import SnoozeAmountModal from './SnoozeAmountModal';
import { useModeratedUserContents } from '@/components/hooks/useModeratedUserContents';
import { getContentSortedByDate, getSoleRejectableContentIndex } from './helpers';
import type { InboxAction } from './inboxReducer';
import type { RejectSidebarTab } from './sidebarTabs';

const SunshineUsersListUpdateMutation = gql(`
  mutation updateUserModerationKeyboard($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...SunshineUsersList
      }
    }
  }
`);

const ApproveCurrentContentOnlyMutation = gql(`
  mutation approveCurrentContentOnlyModerationKeyboard($userId: String!) {
    approveUserCurrentContentOnly(userId: $userId)
  }
`);

/**
 * The moderator actions that can be taken on a user in the moderation inbox
 * (approve, snooze, reject-latest, etc). Shared between the keyboard handler
 * and the clickable buttons in the "Moderator Actions" sidebar section.
 */
export function useModerationUserActions({
  selectedUser,
  currentUser,
  addToUndoQueue,
  dispatch,
}: {
  selectedUser: SunshineUsersList | null;
  currentUser: UsersCurrent;
  addToUndoQueue: (actionLabel: string, executeAction: () => Promise<void>) => void;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
}) {
  const { openDialog } = useDialog();
  const [updateUser] = useMutation(SunshineUsersListUpdateMutation);
  const [approveCurrentContentOnly] = useMutation(ApproveCurrentContentOnlyMutation);

  const { posts, comments } = useModeratedUserContents(selectedUser?._id ?? '', 20);

  const soleRejectableContentIndex = useMemo(
    () => getSoleRejectableContentIndex(getContentSortedByDate(posts, comments)),
    [posts, comments]
  );

  const getModSignatureWithNote = useCallback(
    (note: string) => getSignatureWithNote(currentUser.displayName, note),
    [currentUser.displayName]
  );

  const handleAction = useCallback(
    (actionLabel: string, actionFn: () => Promise<void>) => addToUndoQueue(actionLabel, actionFn),
    [addToUndoQueue]
  );

  const updateUserWith = useCallback((data: UpdateUserDataInput, undoActionLabel?: string) => {
    if (!selectedUser) return;

    const variables = { selector: { _id: selectedUser._id }, data };

    if (undoActionLabel) {
      handleAction(undoActionLabel, async () => { await updateUser({ variables }); });
    } else {
      void updateUser({ variables });
    }
  }, [selectedUser, updateUser, handleAction]);

  const handleReview = useCallback(() => {
    if (!selectedUser) return;
    const notes = selectedUser.sunshineNotes || '';
    const newNotes = getModSignatureWithNote('Approved') + notes;
    void updateUserWith({
      sunshineFlagged: false,
      reviewedByUserId: currentUser._id,
      reviewedAt: new Date(),
      needsReview: false,
      sunshineNotes: newNotes,
      snoozedUntilContentCount: null,
    }, 'Approved');
  }, [selectedUser, currentUser, getModSignatureWithNote, updateUserWith]);

  const handleApproveCurrentOnly = useCallback(() => {
    if (!selectedUser) return;
    handleAction('Approved Current Only', async () => {
      await approveCurrentContentOnly({ variables: { userId: selectedUser._id } });
    });
  }, [selectedUser, handleAction, approveCurrentContentOnly]);

  const handleSnooze = useCallback(
    (contentCount: number) => {
      if (!selectedUser) return;
      const notes = selectedUser.sunshineNotes || '';
      const newNotes = getModSignatureWithNote(`Snooze ${contentCount}`) + notes;
      void updateUserWith({
        needsReview: false,
        reviewedAt: new Date(),
        reviewedByUserId: currentUser._id,
        sunshineNotes: newNotes,
        snoozedUntilContentCount: getNewSnoozeUntilContentCount(selectedUser, contentCount),
      }, `Snoozed ${contentCount}`);
    },
    [selectedUser, currentUser, getModSignatureWithNote, updateUserWith]
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

  const handlePurge = useCallback(() => {
    if (!selectedUser) return;
    if (!confirm("Are you sure you want to delete all this user's posts, comments, sequences, and votes?")) return;

    const notes = selectedUser.sunshineNotes || '';
    const newNotes = getModSignatureWithNote('Purge') + notes;
    void updateUserWith({
      sunshineFlagged: false,
      reviewedByUserId: currentUser._id,
      nullifyVotes: true,
      deleteContent: true,
      needsReview: false,
      reviewedAt: new Date(),
      banned: moment().add(1000, 'years').toDate(),
      sunshineNotes: newNotes,
    }, 'Purged');
  }, [selectedUser, currentUser, getModSignatureWithNote, updateUserWith]);

  // Both of these compose their rejection reason in the sidebar's reject panel,
  // which acts on the focused content item, so they focus the item they're going
  // to reject first. The panel carries out the rest when the reason is submitted.
  const openRejectionComposer = useCallback((sidebarTab: RejectSidebarTab) => {
    if (!selectedUser || soleRejectableContentIndex === null) return;
    dispatch({ type: 'OPEN_CONTENT', contentIndex: soleRejectableContentIndex, sidebarTab });
  }, [selectedUser, soleRejectableContentIndex, dispatch]);

  const handleRestrictAndNotify = useCallback(
    () => openRejectionComposer('rejectRestrictAndNotify'),
    [openRejectionComposer]
  );

  const handleRejectContentAndRemove = useCallback(
    () => openRejectionComposer('rejectAndRemove'),
    [openRejectionComposer]
  );

  return {
    handleReview,
    handleApproveCurrentOnly,
    handleSnooze,
    handleSnoozeCustom,
    handleRejectContentAndRemove,
    handleRestrictAndNotify,
    handlePurge,
    updateUserWith,
    getModSignatureWithNote,
    soleRejectableContentIndex,
    posts,
    comments,
  };
}
