import React, { useCallback, useMemo } from 'react';
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
import { useModeratedUserContents } from '@/components/hooks/useModeratedUserContents';
import type { InboxAction } from './inboxReducer';
import { useUserContentPermissions } from './useUserContentPermissions';
import RejectContentDialog from '../RejectContentDialog';
import { useRejectContent } from '@/components/hooks/useRejectContent';
import { isPost } from './helpers';

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
  mutation rejectContentAndRemoveFromQueueModerationKeyboard($userId: String!, $documentId: String!, $collectionName: ContentCollectionName!) {
    rejectContentAndRemoveUserFromQueue(userId: $userId, documentId: $documentId, collectionName: $collectionName)
  }
`);

const ApproveCurrentContentOnlyMutation = gql(`
  mutation approveCurrentContentOnlyModerationKeyboard($userId: String!) {
    approveUserCurrentContentOnly(userId: $userId)
  }
`);

function specialKeyPressed(event: KeyboardEvent) {
  return event.metaKey || event.ctrlKey || event.altKey;
}

const ModerationKeyboardHandler = ({
  onNextUser,
  onPrevUser,
  onOpenDetail,
  onCloseDetail,
  onNextTab,
  onPrevTab,
  selectedUser,
  selectedContentIndex,
  currentUser,
  onActionComplete,
  isDetailView,
  dispatch,
}: {
  onNextUser: () => void;
  onPrevUser: () => void;
  onOpenDetail: () => void;
  onCloseDetail: () => void;
  onNextTab: () => void;
  onPrevTab: () => void;
  selectedUser: SunshineUsersList | null;
  selectedContentIndex: number;
  isDetailView: boolean;
  currentUser: UsersCurrent;
  onActionComplete: () => void;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
}) => {
  const { openDialog } = useDialog();
  const [updateUser] = useMutation(SunshineUsersListUpdateMutation);
  const [rejectContentAndRemoveFromQueue] = useMutation(RejectContentAndRemoveFromQueueMutation);
  const [approveCurrentContentOnly] = useMutation(ApproveCurrentContentOnlyMutation);
  
  const { posts, comments } = useModeratedUserContents(selectedUser?._id ?? '', 20);
  const { rejectContent, unrejectContent, rejectionTemplates } = useRejectContent();
  
  const allContent = useMemo(() => {
    return [...posts, ...comments].sort((a, b) => 
      new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    );
  }, [posts, comments]);

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

  const handleApproveCurrentOnly = useCallback(() => {
    if (!selectedUser) return;
    void handleAction(async () => {
      await approveCurrentContentOnly({
        variables: {
          userId: selectedUser._id,
        },
      });
    });
  }, [selectedUser, handleAction, approveCurrentContentOnly]);

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
    
    dispatch({ type: 'UPDATE_USER_NOTES', userId: selectedUser._id, sunshineNotes: newNotes });
    
    void updateUser({
      variables: {
        selector: { _id: selectedUser._id },
        data: {
          sunshineFlagged: !selectedUser.sunshineFlagged,
          sunshineNotes: newNotes,
        },
      },
    });
  }, [selectedUser, getModSignatureWithNote, updateUser, dispatch]);

  const handleRejectCurrentContent = useCallback(() => {
    if (!selectedUser) return;
    const selectedContent = allContent[selectedContentIndex];
    if (!selectedContent || selectedContent.rejected) return;

    const contentWrapper = isPost(selectedContent) ? {
      collectionName: 'Posts' as const,
      document: selectedContent,
    } : {
      collectionName: 'Comments' as const,
      document: selectedContent,
    };

    const handleRejectContent = (reason: string) => {
      rejectContent({ ...contentWrapper, reason });
    };

    openDialog({
      name: 'RejectContentDialog',
      contents: ({ onClose }) => (
        <RejectContentDialog
          rejectionTemplates={rejectionTemplates}
          rejectContent={handleRejectContent}
          onClose={onClose}
        />
      ),
    });

  }, [allContent, openDialog, rejectContent, rejectionTemplates, selectedContentIndex, selectedUser]);

  const {
    toggleDisablePosting,
    toggleDisableCommenting,
    toggleDisableMessaging,
    toggleDisableVoting,
  } = useUserContentPermissions(selectedUser, dispatch);

  const handleRestrictAndNotify = useCallback(() => {
    if (!selectedUser) return;
    openDialog({
      name: 'RestrictAndNotifyModal',
      contents: ({ onClose }) => (
        <RestrictAndNotifyModal
          user={selectedUser}
          currentUser={currentUser}
          dispatch={dispatch}
          onComplete={() => {
            onActionComplete();
            onClose();
          }}
          onClose={onClose}
        />
      ),
    });
  }, [selectedUser, currentUser, dispatch, openDialog, onActionComplete]);

  const handleRejectContentAndRemove = useCallback(() => {
    if (!selectedUser) return;
    
    // Find the most recent unapproved post or comment
    const allContent = [
      ...(posts || []).map(p => ({ _id: p._id, postedAt: p.postedAt, rejected: p.rejected, reviewedByUserId: p.reviewedByUserId, collectionName: 'Posts' as const })),
      ...(comments || []).map(c => ({ _id: c._id, postedAt: c.postedAt, rejected: c.rejected, reviewedByUserId: c.reviewedByUserId, collectionName: 'Comments' as const }))
    ];
    
    const unapprovedContent = allContent.filter(
      item => !item.rejected && !item.reviewedByUserId
    );
    
    if (unapprovedContent.length === 0) {
      alert('No unapproved content found for this user');
      return;
    }
    
    // Sort by postedAt descending to get most recent
    unapprovedContent.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    const mostRecentUnapproved = unapprovedContent[0];
    
    if (!confirm(`Reject this user's most recent ${mostRecentUnapproved.collectionName === 'Posts' ? 'post' : 'comment'} and remove them from the review queue?`)) {
      return;
    }
    
    void handleAction(async () => {
      await rejectContentAndRemoveFromQueue({
        variables: {
          userId: selectedUser._id,
          documentId: mostRecentUnapproved._id,
          collectionName: mostRecentUnapproved.collectionName,
        },
      });
    });
  }, [selectedUser, posts, comments, handleAction, rejectContentAndRemoveFromQueue]);

  const openCommandPalette = useCommandPalette();

  const commands: CommandPaletteItem[] = useMemo(() => [
    {
      label: 'Approve',
      keystroke: 'A',
      isDisabled: () => !selectedUser,
      execute: handleReview,
    },
    {
      label: 'Approve Current Content Only',
      keystroke: 'Shift+A',
      isDisabled: () => !selectedUser,
      execute: handleApproveCurrentOnly,
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
      label: 'Remove',
      keystroke: 'Q',
      isDisabled: () => !selectedUser,
      execute: handleRemoveNeedsReview,
    },
    {
      label: 'Reject Latest & Remove',
      keystroke: 'X',
      isDisabled: () => !selectedUser,
      execute: handleRejectContentAndRemove,
    },
    {
      label: 'Ban 3mo',
      keystroke: 'B',
      isDisabled: () => !selectedUser,
      execute: handleBan,
    },
    {
      label: 'Purge',
      keystroke: 'P',
      isDisabled: () => !selectedUser,
      execute: handlePurge,
    },
    {
      label: 'Flag',
      keystroke: 'F',
      isDisabled: () => !selectedUser,
      execute: handleFlag,
    },
    {
      label: 'Disable Posting',
      keystroke: 'D',
      isDisabled: () => !selectedUser,
      execute: toggleDisablePosting,
    },
    {
      label: 'Disable Commenting',
      keystroke: 'C',
      isDisabled: () => !selectedUser,
      execute: toggleDisableCommenting,
    },
    {
      label: 'Disable Messaging',
      keystroke: 'M',
      isDisabled: () => !selectedUser,
      execute: toggleDisableMessaging,
    },
    {
      label: 'Disable Voting',
      keystroke: 'V',
      isDisabled: () => !selectedUser,
      execute: toggleDisableVoting,
    },
    {
      label: 'Reject Current',
      keystroke: 'R',
      isDisabled: () => !selectedUser,
      execute: handleRejectCurrentContent,
    },
    {
      label: 'Reject All, Restrict, & Notify',
      keystroke: 'Shift+R',
      isDisabled: () => !selectedUser,
      execute: handleRestrictAndNotify,
    },
    {
      label: isDetailView ? 'Next Content Item' : 'Next User',
      keystroke: 'arrowdown',
      isDisabled: () => isDetailView ? allContent.length === 0 : false,
      execute: isDetailView 
        ? () => dispatch({ type: 'NEXT_CONTENT', contentLength: allContent.length })
        : onNextUser,
    },
    {
      label: isDetailView ? 'Previous Content Item' : 'Previous User',
      keystroke: 'arrowup',
      isDisabled: () => isDetailView ? allContent.length === 0 : false,
      execute: isDetailView 
        ? () => dispatch({ type: 'PREV_CONTENT', contentLength: allContent.length })
        : onPrevUser,
    },
    {
      label: isDetailView ? 'Next User' : 'Next Tab',
      keystroke: 'arrowright',
      isDisabled: () => false,
      execute: isDetailView ? onNextUser : onNextTab,
    },
    {
      label: isDetailView ? 'Previous User' : 'Previous Tab',
      keystroke: 'arrowleft',
      isDisabled: () => false,
      execute: isDetailView ? onPrevUser : onPrevTab,
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
    ], [handleReview, handleApproveCurrentOnly, handleSnoozeCustom, handleRemoveNeedsReview, handleRejectContentAndRemove, handleBan, handlePurge, handleFlag, toggleDisablePosting, toggleDisableCommenting, toggleDisableMessaging, toggleDisableVoting, handleRejectCurrentContent, handleRestrictAndNotify, onNextUser, onPrevUser, onNextTab, onPrevTab, onOpenDetail, onCloseDetail, selectedUser, handleSnooze, isDetailView, dispatch, allContent]);

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
          // Exception: allow Escape even in inputs
          if (event.key !== 'Escape') {
            return;
          }
        }

        // Command palette
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
          event.preventDefault();
          openCommandPalette(commands, () => {});
          return;
        }

        // Arrow key navigation - context-aware based on view
        // In detail view: up/down = content items, left/right = users
        // In inbox view: up/down = users, left/right = tabs
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          if (isDetailView) {
            dispatch({ type: 'NEXT_CONTENT', contentLength: allContent.length });
          } else {
            onNextUser();
          }
          return;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          if (isDetailView) {
            dispatch({ type: 'PREV_CONTENT', contentLength: allContent.length });
          } else {
            onPrevUser();
          }
          return;
        }

        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          if (isDetailView) {
            onPrevUser();
          } else {
            onPrevTab();
          }
          return;
        }

        if (event.key === 'ArrowRight') {
          event.preventDefault();
          if (isDetailView) {
            onNextUser();
          } else {
            onNextTab();
          }
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

        if (specialKeyPressed(event)) return;

        if (event.key === 'a' && !event.shiftKey) {
          event.preventDefault();
          handleReview();
        } else if (event.key === 'A' && event.shiftKey) {
          event.preventDefault();
          handleApproveCurrentOnly();
        } else if (event.key === 's' && !event.shiftKey) {
          event.preventDefault();
          handleSnooze(10);
        } else if (event.key === 'S' && event.shiftKey) {
          event.preventDefault();
          handleSnoozeCustom();
        } else if (event.key === 'q' && !event.shiftKey) {
          event.preventDefault();
          handleRemoveNeedsReview();
        } else if (event.key === 'r' && !event.shiftKey) {
          event.preventDefault();
          handleRejectCurrentContent();
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
          toggleDisablePosting();
        } else if (event.key === 'c') {
          event.preventDefault();
          toggleDisableCommenting();
        } else if (event.key === 'm') {
          event.preventDefault();
          toggleDisableMessaging();
        } else if (event.key === 'v') {
          event.preventDefault();
          void toggleDisableVoting();
        } else if (event.key === 'x') {
          event.preventDefault();
          handleRejectContentAndRemove();
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
        handleApproveCurrentOnly,
        handleSnooze,
        handleSnoozeCustom,
        handleRemoveNeedsReview,
        handleRejectContentAndRemove,
        handleRejectCurrentContent,
        handleRestrictAndNotify,
        handleBan,
        handlePurge,
        handleFlag,
        toggleDisablePosting,
        toggleDisableCommenting,
        toggleDisableMessaging,
        toggleDisableVoting,
        commands,
        openCommandPalette,
        dispatch,
        allContent,
      ]
    )
  );

  return null;
};

export default ModerationKeyboardHandler;

