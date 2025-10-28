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
import type { InboxAction, UndoHistoryItem } from './inboxReducer';
import { useUserContentPermissions } from './useUserContentPermissions';
import RejectContentDialog from '../RejectContentDialog';
import { useRejectContent } from '@/components/hooks/useRejectContent';
import { ContentItem, isPost } from './helpers';
import { useMessages } from '@/components/common/withMessages';
import { parseKeystroke, getCode } from '@/lib/vendor/ckeditor5-util/keyboard';

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

function specialKeyPressed(event: KeyboardEvent) {
  return event.metaKey || event.ctrlKey || event.altKey;
}

function isNavigationKey(key: string) {
  return key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Enter' || key === 'Escape';
}

function matchesKeystroke(event: KeyboardEvent, keystroke: string): boolean {
  const key = event.key;

  if (key === 'Escape') {
    return keystroke === 'esc';
  }

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

function canRejectCurrentlySelectedContent(selectedContent?: ContentItem) {
  return selectedContent && !selectedContent.rejected && selectedContent.authorIsUnreviewed;
}

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
  addToUndoQueue,
  undoQueue,
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
  addToUndoQueue: (actionLabel: string, executeAction: () => Promise<void>) => void;
  undoQueue: UndoHistoryItem[];
  dispatch: React.ActionDispatch<[action: InboxAction]>;
}) => {
  const { openDialog, isDialogOpen } = useDialog();
  const { flash } = useMessages();
  const [updateUser] = useMutation(SunshineUsersListUpdateMutation);
  const [rejectContentAndRemoveFromQueue] = useMutation(RejectContentAndRemoveFromQueueMutation);
  const [approveCurrentContentOnly] = useMutation(ApproveCurrentContentOnlyMutation);
  
  const { posts, comments } = useModeratedUserContents(selectedUser?._id ?? '', 20);

  const {
    rejectContent,
    unrejectContent,
    rejectionTemplates,
  } = useRejectContent();

  const {
    toggleDisablePosting,
    toggleDisableCommenting,
    toggleDisableMessaging,
    toggleDisableVoting,
  } = useUserContentPermissions(selectedUser, dispatch);
  
  const allContent = useMemo(() => {
    return [...posts, ...comments].sort((a, b) => 
      new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    );
  }, [posts, comments]);

  const selectedContent = useMemo<ContentItem | undefined>(() => allContent[selectedContentIndex], [allContent, selectedContentIndex]);

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

  const handleRemoveNeedsReview = useCallback(() => {
    if (!selectedUser) return;
    const notes = selectedUser.sunshineNotes || '';
    const newNotes = getModSignatureWithNote('removed from review queue without snooze/approval') + notes;
    void updateUserWith({
      needsReview: false,
      reviewedByUserId: null,
      reviewedAt: selectedUser.reviewedAt ? new Date() : null,
      sunshineNotes: newNotes,
    }, 'Removed from queue');
  }, [selectedUser, getModSignatureWithNote, updateUserWith]);

  const handleBan = useCallback(() => {
    if (!selectedUser) return;
    const banMonths = 3;
    if (!confirm(`Ban this user for ${banMonths} months?`)) return;

    const notes = selectedUser.sunshineNotes || '';
    const newNotes = getModSignatureWithNote('Ban') + notes;
    void updateUserWith({
      sunshineFlagged: false,
      reviewedByUserId: currentUser._id,
      needsReview: false,
      reviewedAt: new Date(),
      banned: moment().add(banMonths, 'months').toDate(),
      sunshineNotes: newNotes,
    }, 'Banned 3mo');
  }, [selectedUser, currentUser, getModSignatureWithNote, updateUserWith]);

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

  const handleFlag = useCallback(() => {
    if (!selectedUser) return;
    const flagStatus = selectedUser.sunshineFlagged ? 'Unflag' : 'Flag';
    const notes = selectedUser.sunshineNotes || '';
    const newNotes = getModSignatureWithNote(flagStatus) + notes;
    const newFlaggedState = !selectedUser.sunshineFlagged;
    
    dispatch({ type: 'UPDATE_USER', userId: selectedUser._id, fields: { sunshineNotes: newNotes, sunshineFlagged: newFlaggedState } });
    
    void updateUserWith({
      sunshineFlagged: newFlaggedState,
      sunshineNotes: newNotes,
    });
  }, [selectedUser, getModSignatureWithNote, dispatch, updateUserWith]);

  const handleRejectCurrentContent = useCallback(() => {
    if (!selectedUser) return;
    if (!selectedContent || !canRejectCurrentlySelectedContent(selectedContent)) return;

    const contentWrapper = isPost(selectedContent) ? {
      collectionName: 'Posts' as const,
      document: selectedContent,
    } : {
      collectionName: 'Comments' as const,
      document: selectedContent,
    };

    const handleRejectContent = (reason: string) => { void rejectContent({ ...contentWrapper, reason }); };

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
  }, [openDialog, rejectContent, rejectionTemplates, selectedContent, selectedUser]);

  const handleUnrejectCurrentContent = useCallback(() => {
    if (!selectedUser) return;
    if (!selectedContent?.rejected) return;
    if (!confirm("Are you sure you want to unreject this content?")) return;

    const contentWrapper = isPost(selectedContent) ? {
      collectionName: 'Posts' as const,
      document: selectedContent,
    } : {
      collectionName: 'Comments' as const,
      document: selectedContent,
    };

    void unrejectContent(contentWrapper);
  }, [selectedUser, selectedContent, unrejectContent]);

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

  const handleCopyUserId = useCallback(async () => {
    if (!selectedUser) return;
    
    try {
      await navigator.clipboard.writeText(selectedUser._id);
      flash({ messageString: "userId copied!" });
    } catch (err) {
      flash({ messageString: "Failed to copy userId" });
    }
  }, [selectedUser, flash]);

  const handleUndoMostRecent = useCallback(() => {
    if (undoQueue.length === 0) return;
    
    // Get the most recent item (last in array since we append)
    const mostRecentItem = undoQueue[undoQueue.length - 1];
    dispatch({ type: 'UNDO_ACTION', userId: mostRecentItem.user._id });
    flash({ messageString: `Undid: ${mostRecentItem.actionLabel}` });
  }, [undoQueue, dispatch, flash]);

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

  const openCommandPalette = useCommandPalette({ large: true, hideDisabledCommands: true });

  const approveCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Approve',
    keystroke: 'A',
    isDisabled: () => !selectedUser,
    execute: handleReview,
  }), [selectedUser, handleReview]);

  const approveCurrentOnlyCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Approve Current Content Only',
    keystroke: 'Shift+A',
    isDisabled: () => !selectedUser,
    execute: handleApproveCurrentOnly,
  }), [selectedUser, handleApproveCurrentOnly]);

  const snooze10Command: CommandPaletteItem = useMemo(() => ({
    label: 'Snooze 10',
    keystroke: 'S',
    isDisabled: () => !selectedUser,
    execute: () => handleSnooze(10),
  }), [selectedUser, handleSnooze]);

  const snoozeCustomCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Snooze Custom Amount',
    keystroke: 'Shift+S',
    isDisabled: () => !selectedUser,
    execute: handleSnoozeCustom,
  }), [selectedUser, handleSnoozeCustom]);

  const removeCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Remove',
    keystroke: 'Q',
    isDisabled: () => !selectedUser,
    execute: handleRemoveNeedsReview,
  }), [selectedUser, handleRemoveNeedsReview]);

  const ban3moCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Ban 3mo',
    keystroke: 'B',
    isDisabled: () => !selectedUser,
    execute: handleBan,
  }), [selectedUser, handleBan]);

  const purgeCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Purge',
    keystroke: 'P',
    isDisabled: () => !selectedUser,
    execute: handlePurge,
  }), [selectedUser, handlePurge]);

  const flagCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Flag',
    keystroke: 'F',
    isDisabled: () => !selectedUser,
    execute: handleFlag,
  }), [selectedUser, handleFlag]);

  const copyUserIdCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Copy User ID',
    keystroke: 'U',
    isDisabled: () => !selectedUser,
    execute: handleCopyUserId,
  }), [selectedUser, handleCopyUserId]);

  const rejectOrUnrejectCommand: CommandPaletteItem = useMemo(() => ({
    label: selectedContent?.rejected ? 'Unreject' : 'Reject',
    keystroke: 'R',
    isDisabled: () => (
      !isDetailView
      || !selectedUser
      || (selectedContent?.rejected
          ? !selectedContent.rejected
          : !canRejectCurrentlySelectedContent(selectedContent))
    ),
    execute: selectedContent?.rejected
      ? handleUnrejectCurrentContent
      : handleRejectCurrentContent,
  }), [isDetailView, selectedUser, selectedContent, handleRejectCurrentContent, handleUnrejectCurrentContent]);

  const rejectLatestAndRemoveCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Reject Latest & Remove',
    keystroke: 'X',
    isDisabled: () => !isDetailView || !selectedUser,
    execute: handleRejectContentAndRemove,
  }), [isDetailView, selectedUser, handleRejectContentAndRemove]);

  const restrictAndNotifyCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Reject Latest, Restrict, & Notify',
    keystroke: 'Shift+R',
    isDisabled: () => !isDetailView || !selectedUser,
    execute: handleRestrictAndNotify,
  }), [isDetailView, selectedUser, handleRestrictAndNotify]);

  const disablePostingCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Disable Posting',
    keystroke: 'D',
    isDisabled: () => !isDetailView || !selectedUser,
    execute: toggleDisablePosting,
  }), [isDetailView, selectedUser, toggleDisablePosting]);

  const disableCommentingCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Disable Commenting',
    keystroke: 'C',
    isDisabled: () => !isDetailView || !selectedUser,
    execute: toggleDisableCommenting,
  }), [isDetailView, selectedUser, toggleDisableCommenting]);

  const disableMessagingCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Disable Messaging',
    keystroke: 'M',
    isDisabled: () => !isDetailView || !selectedUser,
    execute: toggleDisableMessaging,
  }), [isDetailView, selectedUser, toggleDisableMessaging]);

  const disableVotingCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Disable Voting',
    keystroke: 'V',
    isDisabled: () => !isDetailView || !selectedUser,
    execute: toggleDisableVoting,
  }), [isDetailView, selectedUser, toggleDisableVoting]);

  const nextContentOrUserCommand: CommandPaletteItem = useMemo(() => ({
    label: isDetailView ? 'Next Content Item' : 'Next User',
    keystroke: 'ArrowDown',
    isDisabled: () => isDetailView
      ? allContent.length === 0
      : false,
    execute: isDetailView
      ? () => dispatch({ type: 'NEXT_CONTENT', contentLength: allContent.length })
      : onNextUser,
  }), [isDetailView, allContent.length, dispatch, onNextUser]);

  const previousContentOrUserCommand: CommandPaletteItem = useMemo(() => ({
    label: isDetailView ? 'Previous Content Item' : 'Previous User',
    keystroke: 'ArrowUp',
    isDisabled: () => isDetailView
      ? allContent.length === 0
      : false,
    execute: isDetailView
      ? () => dispatch({ type: 'PREV_CONTENT', contentLength: allContent.length })
      : onPrevUser,
  }), [isDetailView, allContent.length, dispatch, onPrevUser]);

  const nextUserOrTabCommand: CommandPaletteItem = useMemo(() => ({
    label: isDetailView ? 'Next User' : 'Next Tab',
    keystroke: 'ArrowRight',
    isDisabled: () => false,
    execute: isDetailView ? onNextUser : onNextTab,
  }), [onNextUser, onNextTab, isDetailView]);
  
  const previousUserOrTabCommand: CommandPaletteItem = useMemo(() => ({
    label: isDetailView ? 'Previous User' : 'Previous Tab',
    keystroke: 'ArrowLeft',
    isDisabled: () => false,
    execute: isDetailView ? onPrevUser : onPrevTab,
  }), [onPrevUser, onPrevTab, isDetailView]);

  const openOrCloseDetailViewCommand: CommandPaletteItem = useMemo(() => ({
    label: isDetailView ? 'Close Detail View' : 'Open Detail View',
    keystroke: isDetailView ? 'esc' : 'enter',
    isDisabled: () => !selectedUser,
    execute: isDetailView ? onCloseDetail : onOpenDetail,
  }), [onCloseDetail, onOpenDetail, isDetailView, selectedUser]);

  const undoMostRecentActionCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Undo Most Recent Action',
    keystroke: 'Ctrl+Z',
    isDisabled: () => undoQueue.length === 0,
    execute: handleUndoMostRecent,
  }), [handleUndoMostRecent, undoQueue.length]);

  const commands: CommandPaletteItem[] = useMemo(() => [
    approveCommand, approveCurrentOnlyCommand,
    snooze10Command, snoozeCustomCommand,
    removeCommand,
    rejectOrUnrejectCommand, rejectLatestAndRemoveCommand, restrictAndNotifyCommand,
    purgeCommand,
    flagCommand,
    copyUserIdCommand,
    disablePostingCommand, disableCommentingCommand, disableMessagingCommand, disableVotingCommand,
    nextContentOrUserCommand, previousContentOrUserCommand, nextUserOrTabCommand, previousUserOrTabCommand,
    openOrCloseDetailViewCommand, undoMostRecentActionCommand,
    ban3moCommand,
  ], [approveCommand, approveCurrentOnlyCommand, snooze10Command, snoozeCustomCommand, removeCommand, ban3moCommand, purgeCommand, flagCommand, copyUserIdCommand, rejectOrUnrejectCommand, rejectLatestAndRemoveCommand, restrictAndNotifyCommand, disablePostingCommand, disableCommentingCommand, disableMessagingCommand, disableVotingCommand, nextContentOrUserCommand, previousContentOrUserCommand, nextUserOrTabCommand, previousUserOrTabCommand, openOrCloseDetailViewCommand, undoMostRecentActionCommand]);

  useGlobalKeydown(
    useCallback(
      (event: KeyboardEvent) => {
        // Don't trigger any shortcuts if a dialog is open.
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
          // Exception: allow Escape even in inputs
          if (event.key !== 'Escape') {
            return;
          }
        }

        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
          event.preventDefault();
          openCommandPalette(commands, () => {});
          return;
        }

        // Block shortcuts when special keys (Cmd/Ctrl/Alt) are pressed, except for navigation keys
        if (specialKeyPressed(event) && (!isNavigationKey(event.key) && event.key !== 'z')) {
          return;
        }

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

export default ModerationKeyboardHandler;

