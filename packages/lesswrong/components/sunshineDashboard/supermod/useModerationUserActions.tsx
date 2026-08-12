import React, { useCallback } from 'react';
import { useDialog } from '@/components/common/withDialog';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { getSignatureWithNote } from '@/lib/collections/users/helpers';
import { getNewSnoozeUntilContentCount } from '../ModeratorActions';
import SnoozeAmountModal from './SnoozeAmountModal';
import RestrictAndNotifyModal from './RestrictAndNotifyModal';
import { useModeratedUserContents } from '@/components/hooks/useModeratedUserContents';
import RejectContentDialog from '../RejectContentDialog';
import { useRejectContent } from '@/components/hooks/useRejectContent';

const SunshineUsersListUpdateMutation = gql(`
  mutation updateUserModerationKeyboard($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...SunshineUsersList
      }
    }
  }
`);

const RejectContentAndRemoveFromQueueMutation = gql(`
  mutation rejectContentAndRemoveFromQueueModerationKeyboard($userId: String!, $documentId: String!, $collectionName: ContentCollectionName!, $rejectedReason: String!) {
    rejectContentAndRemoveUserFromQueue(userId: $userId, documentId: $documentId, collectionName: $collectionName, rejectedReason: $rejectedReason)
  }
`);

const ApproveCurrentContentOnlyMutation = gql(`
  mutation approveCurrentContentOnlyModerationKeyboard($userId: String!) {
    approveUserCurrentContentOnly(userId: $userId)
  }
`);

function getMostRecentUnapprovedContent(posts: SunshinePostsList[], comments: CommentsListWithParentMetadata[]) {
  const allContent = [
    ...(posts || []).map(p => ({ _id: p._id, postedAt: p.postedAt, rejected: p.rejected, authorIsUnreviewed: p.authorIsUnreviewed, collectionName: 'Posts' as const })),
    ...(comments || []).map(c => ({ _id: c._id, postedAt: c.postedAt, rejected: c.rejected, authorIsUnreviewed: c.authorIsUnreviewed, collectionName: 'Comments' as const }))
  ];

  const unapprovedContent = allContent.filter(
    item => !item.rejected && item.authorIsUnreviewed
  );

  if (unapprovedContent.length === 0) {
    return null;
  }

  unapprovedContent.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  return unapprovedContent[0];
}

/**
 * The moderator actions that can be taken on a user in the moderation inbox
 * (approve, snooze, reject-latest, etc). Shared between the keyboard handler
 * and the clickable buttons in the "Moderator Actions" sidebar section.
 */
export function useModerationUserActions({
  selectedUser,
  currentUser,
  addToUndoQueue,
}: {
  selectedUser: SunshineUsersList | null;
  currentUser: UsersCurrent;
  addToUndoQueue: (actionLabel: string, executeAction: () => Promise<void>) => void;
}) {
  const { openDialog } = useDialog();
  const [updateUser] = useMutation(SunshineUsersListUpdateMutation);
  const [rejectContentAndRemoveFromQueue] = useMutation(RejectContentAndRemoveFromQueueMutation);
  const [approveCurrentContentOnly] = useMutation(ApproveCurrentContentOnlyMutation);

  const { posts, comments } = useModeratedUserContents(selectedUser?._id ?? '', 20);

  const { rejectionTemplates } = useRejectContent();

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

  const handleRestrictAndNotify = useCallback(() => {
    if (!selectedUser) return;
    
    // Find the most recent unapproved post or comment
    const mostRecentUnapproved = getMostRecentUnapprovedContent(posts, comments);
    if (!mostRecentUnapproved) {
      alert('No unapproved content found for this user');
      return;
    }

    openDialog({
      name: 'RejectContentDialog',
      contents: ({ onClose: closeRejectDialog }) => (
        <RejectContentDialog
          rejectionTemplates={rejectionTemplates}
          displayName={selectedUser.displayName}
          rejectContent={(rejectedReason: string) => {
            closeRejectDialog();
            
            // We need setTimeout to ensure the RejectContentDialog is closed before the RestrictAndNotifyModal is opened;
            // otherwise the second modal just doesn't open.
            setTimeout(() => {
              openDialog({
                name: 'RestrictAndNotifyModal',
                contents: ({ onClose: closeRestrictDialog }) => (
                  <RestrictAndNotifyModal
                    user={selectedUser}
                    onComplete={(executeAction: () => Promise<void>) => {
                      closeRestrictDialog();
                      addToUndoQueue('Restricted & Notified', executeAction);
                    }}
                    onClose={closeRestrictDialog}
                    rejectedReason={rejectedReason}
                    documentId={mostRecentUnapproved._id}
                    collectionName={mostRecentUnapproved.collectionName}
                  />
                ),
              });
            }, 0);
          }}
          onClose={closeRejectDialog}
        />
      ),
    });
  }, [selectedUser, openDialog, addToUndoQueue, posts, comments, rejectionTemplates]);

  const handleRejectContentAndRemove = useCallback(() => {
    if (!selectedUser) return;
    
    const mostRecentUnapproved = getMostRecentUnapprovedContent(posts, comments);
    if (!mostRecentUnapproved) {
      alert('No unapproved content found for this user');
      return;
    }
    
    openDialog({
      name: 'RejectContentDialog',
      contents: ({ onClose }) => (
        <RejectContentDialog
          rejectionTemplates={rejectionTemplates}
          displayName={selectedUser.displayName}
          rejectContent={(rejectedReason: string) => {
            onClose();
            handleAction('Rejected & Removed', async () => {
              await rejectContentAndRemoveFromQueue({
                variables: {
                  userId: selectedUser._id,
                  documentId: mostRecentUnapproved._id,
                  collectionName: mostRecentUnapproved.collectionName,
                  rejectedReason,
                },
              });
            });
          }}
          onClose={onClose}
        />
      ),
    });
  }, [selectedUser, posts, comments, handleAction, rejectContentAndRemoveFromQueue, openDialog, rejectionTemplates]);

  return {
    handleReview,
    handleApproveCurrentOnly,
    handleSnooze,
    handleSnoozeCustom,
    handleRejectContentAndRemove,
    handleRestrictAndNotify,
    updateUserWith,
    getModSignatureWithNote,
  };
}
