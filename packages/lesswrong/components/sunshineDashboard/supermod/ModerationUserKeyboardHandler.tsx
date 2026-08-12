import React, { useCallback, useMemo } from 'react';
import type { CommandPaletteItem } from '@/components/common/CommandPalette';
import moment from 'moment';
import { useSupermodKeyboardCommands } from '@/components/hooks/useSupermodKeyboardCommands';
import type { InboxAction, UndoHistoryItem } from './inboxReducer';
import { useUserContentPermissions } from './useUserContentPermissions';
import { useRejectContent } from '@/components/hooks/useRejectContent';
import { useModerationUserActions } from './useModerationUserActions';
import { canRejectContent, ContentItem, isPost } from './helpers';
import { useMessages } from '@/components/common/withMessages';
import { useRerunLlmCheck } from './useRerunLlmCheck';

function canRerunLlmCheck(selectedContent?: ContentItem) {
  if (!selectedContent) return false;
  const ace = selectedContent.automatedContentEvaluations;
  return !ace || ace.pangramScore === null;
}

const ModerationUserKeyboardHandler = ({
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
  onFocusRejectTab,
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
  /** Moves the moderation sidebar to its "reject the selected content" tab. */
  onFocusRejectTab: () => void;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
}) => {
  const { flash } = useMessages();

  const {
    unrejectContent,
  } = useRejectContent();

  const {
    handleReview,
    handleApproveCurrentOnly,
    handleSnooze,
    handleSnoozeCustom,
    handleRejectContentAndRemove,
    handleRestrictAndNotify,
    updateUserWith,
    getModSignatureWithNote,
    posts,
    comments,
  } = useModerationUserActions({ selectedUser, currentUser, addToUndoQueue });

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

  const selectedContentId = selectedContent?._id ?? null;
  const selectedContentCollectionName = selectedContent ? (isPost(selectedContent) ? 'Posts' as const : 'Comments' as const) : 'Posts' as const;
  const { handleRerunLlmCheck, isRunningLlmCheck } = useRerunLlmCheck(selectedContentId, selectedContentCollectionName, dispatch);

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

  const rerunLlmCheckCommand: CommandPaletteItem = useMemo(() => ({
    label: 'Rerun LLM Check',
    keystroke: 'L',
    isDisabled: () => !isDetailView || !selectedContent || !canRerunLlmCheck(selectedContent) || isRunningLlmCheck,
    execute: handleRerunLlmCheck,
  }), [isDetailView, selectedContent, isRunningLlmCheck, handleRerunLlmCheck]);

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
          : !canRejectContent(selectedContent))
    ),
    execute: selectedContent?.rejected
      ? handleUnrejectCurrentContent
      : onFocusRejectTab,
  }), [isDetailView, selectedUser, selectedContent, onFocusRejectTab, handleUnrejectCurrentContent]);

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
    rerunLlmCheckCommand,
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
  ], [rerunLlmCheckCommand, approveCommand, approveCurrentOnlyCommand, snooze10Command, snoozeCustomCommand, removeCommand, ban3moCommand, purgeCommand, flagCommand, copyUserIdCommand, rejectOrUnrejectCommand, rejectLatestAndRemoveCommand, restrictAndNotifyCommand, disablePostingCommand, disableCommentingCommand, disableMessagingCommand, disableVotingCommand, nextContentOrUserCommand, previousContentOrUserCommand, nextUserOrTabCommand, previousUserOrTabCommand, openOrCloseDetailViewCommand, undoMostRecentActionCommand]);

  useSupermodKeyboardCommands({
    commands,
    handleWhileInTextInputs: ['Escape'],
    allowWithSpecialKeys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'z'],
  });

  return null;
};

export default ModerationUserKeyboardHandler;
