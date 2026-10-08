import { useCallback } from 'react';
import moment from 'moment';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { getSignatureWithNote } from '@/lib/collections/users/helpers';
import { getNewSnoozeUntilContentCount } from '../ModeratorActions';
import { VOTING_DISABLED } from '@/lib/collections/moderatorActions/constants';
import { useRejectContent } from '@/components/hooks/useRejectContent';
import { useMessages } from '@/components/common/withMessages';
import {
  parseProposalSteps,
  stepExecutionOrder,
  type ModerationProposalStep,
  type ModerationProposalStepResult,
} from '@/lib/collections/moderationProposals/proposalSteps';

const UpdateUserApplyProposalMutation = gql(`
  mutation updateUserApplyModerationProposal($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...SunshineUsersList
      }
    }
  }
`);

const RejectContentAndRemoveFromQueueApplyProposalMutation = gql(`
  mutation rejectContentAndRemoveFromQueueApplyProposal($userId: String!, $documentId: String!, $collectionName: ContentCollectionName!, $rejectedReason: String!, $messageContent: String) {
    rejectContentAndRemoveUserFromQueue(userId: $userId, documentId: $documentId, collectionName: $collectionName, rejectedReason: $rejectedReason, messageContent: $messageContent)
  }
`);

const ApproveCurrentContentOnlyApplyProposalMutation = gql(`
  mutation approveCurrentContentOnlyApplyProposal($userId: String!) {
    approveUserCurrentContentOnly(userId: $userId)
  }
`);

const CreateModeratorActionApplyProposalMutation = gql(`
  mutation createModeratorActionApplyProposal($data: CreateModeratorActionDataInput!) {
    createModeratorAction(data: $data) {
      data {
        _id
        type
        userId
        endedAt
      }
    }
  }
`);

const UpdateModeratorActionApplyProposalMutation = gql(`
  mutation updateModeratorActionApplyProposal($selector: SelectorInput!, $data: UpdateModeratorActionDataInput!) {
    updateModeratorAction(selector: $selector, data: $data) {
      data {
        _id
        type
        userId
        endedAt
      }
    }
  }
`);

const CreateUserRateLimitApplyProposalMutation = gql(`
  mutation createUserRateLimitApplyProposal($data: CreateUserRateLimitDataInput!) {
    createUserRateLimit(data: $data) {
      data {
        _id
      }
    }
  }
`);

const InitiateConversationApplyProposalMutation = gql(`
  mutation initiateConversationApplyProposal($participantIds: [String!]!, $moderator: Boolean) {
    initiateConversation(participantIds: $participantIds, moderator: $moderator) {
      ...ConversationsMinimumInfo
    }
  }
`);

const CreateMessageApplyProposalMutation = gql(`
  mutation createMessageApplyProposal($data: CreateMessageDataInput!) {
    createMessage(data: $data) {
      data {
        _id
      }
    }
  }
`);

const UpdateModerationProposalApplyProposalMutation = gql(`
  mutation updateModerationProposalApplyProposal($selector: SelectorInput!, $data: UpdateModerationProposalDataInput!) {
    updateModerationProposal(selector: $selector, data: $data) {
      data {
        ...ModerationProposalDisplay
      }
    }
  }
`);

export interface ApplicableProposal {
  _id: string;
  targetUserId: string | null;
  title: string | null;
  steps: unknown;
}

export function useApplyModerationProposal({ user, currentUser, posts, comments, addToUndoQueue }: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  posts: SunshinePostsList[];
  comments: CommentsListWithParentMetadata[];
  addToUndoQueue: (actionLabel: string, executeAction: () => Promise<void>) => void;
}) {
  const { flash } = useMessages();
  const [updateUser] = useMutation(UpdateUserApplyProposalMutation);
  const [rejectAndRemove] = useMutation(RejectContentAndRemoveFromQueueApplyProposalMutation);
  const [approveCurrentContentOnly] = useMutation(ApproveCurrentContentOnlyApplyProposalMutation);
  const [createModeratorAction] = useMutation(CreateModeratorActionApplyProposalMutation);
  const [updateModeratorAction] = useMutation(UpdateModeratorActionApplyProposalMutation);
  const [createUserRateLimit] = useMutation(CreateUserRateLimitApplyProposalMutation);
  const [initiateConversation] = useMutation(InitiateConversationApplyProposalMutation);
  const [createMessage] = useMutation(CreateMessageApplyProposalMutation);
  const [updateProposal] = useMutation(UpdateModerationProposalApplyProposalMutation);
  const { rejectContent, unrejectContent } = useRejectContent();

  const applyProposal = useCallback((proposal: ApplicableProposal, selectedIndexes: Set<number>) => {
    if (proposal.targetUserId !== user._id) {
      flash({ messageString: 'This proposal targets a different user' });
      return;
    }

    const parsedSteps = parseProposalSteps(proposal.steps);
    const results = new Map<number, ModerationProposalStepResult>();
    const stepsToRun: Array<{ index: number; step: ModerationProposalStep }> = [];

    parsedSteps.forEach((step, index) => {
      if (!step) {
        results.set(index, { index, status: 'failed', error: 'Unrecognized step' });
      } else if (!selectedIndexes.has(index)) {
        results.set(index, { index, status: 'skipped', error: 'Unchecked by moderator' });
      } else {
        stepsToRun.push({ index, step });
      }
    });

    stepsToRun.sort((a, b) => stepExecutionOrder(a.step) - stepExecutionOrder(b.step));

    // sunshineNotes are prepend-only; thread the accumulating value through the
    // steps so sequential updates don't clobber each other.
    const signNote = (note: string) => getSignatureWithNote(currentUser.displayName, note);

    const executeAction = async () => {
      let notes = user.sunshineNotes ?? '';
      const addNote = (note: string) => {
        notes = signNote(note) + notes;
        return notes;
      };

      const applyStep = async (step: ModerationProposalStep): Promise<'applied' | 'skipped'> => {
        switch (step.action) {
          case 'approveUser': {
            await updateUser({ variables: { selector: { _id: user._id }, data: {
              sunshineFlagged: false,
              reviewedByUserId: currentUser._id,
              reviewedAt: new Date(),
              needsReview: false,
              snoozedUntilContentCount: null,
              sunshineNotes: addNote('Approved (agent plan)'),
            } } });
            return 'applied';
          }
          case 'approveCurrentContentOnly': {
            await approveCurrentContentOnly({ variables: { userId: user._id } });
            return 'applied';
          }
          case 'snooze': {
            await updateUser({ variables: { selector: { _id: user._id }, data: {
              needsReview: false,
              reviewedAt: new Date(),
              reviewedByUserId: currentUser._id,
              snoozedUntilContentCount: getNewSnoozeUntilContentCount(user, step.contentCount),
              sunshineNotes: addNote(`Snooze ${step.contentCount} (agent plan)`),
            } } });
            return 'applied';
          }
          case 'removeFromQueue': {
            await updateUser({ variables: { selector: { _id: user._id }, data: {
              needsReview: false,
              reviewedByUserId: null,
              reviewedAt: user.reviewedAt ? new Date() : null,
              sunshineNotes: addNote('removed from review queue without snooze/approval (agent plan)'),
            } } });
            return 'applied';
          }
          case 'banUser': {
            await updateUser({ variables: { selector: { _id: user._id }, data: {
              sunshineFlagged: false,
              reviewedByUserId: currentUser._id,
              needsReview: false,
              reviewedAt: new Date(),
              banned: moment().add(step.months, 'months').toDate(),
              sunshineNotes: addNote(`Ban ${step.months}mo (agent plan)`),
            } } });
            return 'applied';
          }
          case 'flagUser': {
            if (user.sunshineFlagged === step.flagged) return 'skipped';
            await updateUser({ variables: { selector: { _id: user._id }, data: {
              sunshineFlagged: step.flagged,
              sunshineNotes: addNote(`${step.flagged ? 'Flag' : 'Unflag'} (agent plan)`),
            } } });
            return 'applied';
          }
          case 'setContentPermission': {
            if (step.permission === 'voting') {
              if (user.votingDisabled === step.disabled) return 'skipped';
              if (step.disabled) {
                await createModeratorAction({ variables: { data: { userId: user._id, type: VOTING_DISABLED } } });
              } else {
                const activeAction = user.moderatorActions?.find(
                  (moderatorAction) => moderatorAction.type === VOTING_DISABLED && !moderatorAction.endedAt
                );
                if (activeAction) {
                  await updateModeratorAction({ variables: { selector: { _id: activeAction._id }, data: { endedAt: new Date() } } });
                }
              }
              await updateUser({ variables: { selector: { _id: user._id }, data: {
                sunshineNotes: addNote(`voting ${step.disabled ? 'disabled' : 'enabled'} (agent plan)`),
              } } });
              return 'applied';
            }
            const fieldByPermission = {
              posting: 'postingDisabled',
              allCommenting: 'allCommentingDisabled',
              conversations: 'conversationsDisabled',
            } as const;
            const notePrefixByPermission = {
              posting: 'publishing posts',
              allCommenting: 'all commenting',
              conversations: 'messaging',
            } as const;
            const field = fieldByPermission[step.permission];
            if (user[field] === step.disabled) return 'skipped';
            await updateUser({ variables: { selector: { _id: user._id }, data: {
              [field]: step.disabled,
              sunshineNotes: addNote(`${notePrefixByPermission[step.permission]} ${step.disabled ? 'disabled' : 'enabled'} (agent plan)`),
            } } });
            return 'applied';
          }
          case 'setRateLimit': {
            await createUserRateLimit({ variables: { data: {
              userId: user._id,
              type: step.type,
              intervalUnit: step.intervalUnit,
              intervalLength: step.intervalLength,
              actionsPerInterval: step.actionsPerInterval,
              // CreateUserRateLimitDataInput requires an end date; match the
              // 3-week default used by the manual rate-limit buttons.
              endedAt: moment().add(step.endAfterDays ?? 21, 'days').toDate(),
            } } });
            return 'applied';
          }
          case 'sendModeratorMessage': {
            const { data: conversationData } = await initiateConversation({
              variables: { participantIds: [currentUser._id, user._id], moderator: true },
            });
            const conversationId = conversationData?.initiateConversation?._id;
            if (!conversationId) {
              throw new Error('Failed to create conversation');
            }
            await createMessage({ variables: { data: {
              conversationId,
              contents: {
                originalContents: {
                  type: 'ckEditorMarkup',
                  data: step.messageHtml,
                },
              },
            } } });
            return 'applied';
          }
          case 'appendSunshineNote': {
            await updateUser({ variables: { selector: { _id: user._id }, data: {
              sunshineNotes: addNote(`[agent plan] ${step.note}`),
            } } });
            return 'applied';
          }
          case 'rejectContent':
          case 'unrejectContent': {
            const post = step.collectionName === 'Posts' ? posts.find(p => p._id === step.documentId) : undefined;
            const comment = step.collectionName === 'Comments' ? comments.find(c => c._id === step.documentId) : undefined;
            const contentWrapper = post
              ? { collectionName: 'Posts' as const, document: post }
              : comment
                ? { collectionName: 'Comments' as const, document: comment }
                : null;
            if (!contentWrapper) {
              throw new Error('Content not loaded in the moderation view');
            }
            if (step.action === 'rejectContent') {
              if (contentWrapper.document.rejected) return 'skipped';
              await rejectContent({ ...contentWrapper, reason: step.rejectedReason });
            } else {
              if (!contentWrapper.document.rejected) return 'skipped';
              await unrejectContent(contentWrapper);
            }
            return 'applied';
          }
          case 'rejectContentAndRemoveFromQueue': {
            await rejectAndRemove({ variables: {
              userId: user._id,
              documentId: step.documentId,
              collectionName: step.collectionName,
              rejectedReason: step.rejectedReason,
              messageContent: step.messageHtml ?? null,
            } });
            return 'applied';
          }
        }
      };

      for (const { index, step } of stepsToRun) {
        try {
          const status = await applyStep(step);
          results.set(index, { index, status });
        } catch (error) {
          results.set(index, { index, status: 'failed', error: error instanceof Error ? error.message : 'Failed' });
        }
      }

      const orderedResults = [...results.values()].sort((a, b) => a.index - b.index);
      const anyFailedOrSkipped = orderedResults.some(result => result.status !== 'applied');
      await updateProposal({ variables: {
        selector: { _id: proposal._id },
        data: {
          status: anyFailedOrSkipped ? 'partiallyApplied' : 'applied',
          stepResults: orderedResults,
          appliedByUserId: currentUser._id,
          appliedAt: new Date(),
        },
      } });

      const failures = orderedResults.filter(result => result.status === 'failed');
      if (failures.length) {
        flash({ messageString: `Agent plan: ${failures.length} step(s) failed` });
      }
    };

    addToUndoQueue(`Agent plan: ${proposal.title ?? 'Untitled'}`, executeAction);
  }, [
    user, currentUser, posts, comments, flash, addToUndoQueue,
    updateUser, rejectAndRemove, approveCurrentContentOnly, createModeratorAction,
    updateModeratorAction, createUserRateLimit, initiateConversation, createMessage,
    updateProposal, rejectContent, unrejectContent,
  ]);

  const dismissProposal = useCallback(async (proposalId: string) => {
    await updateProposal({ variables: {
      selector: { _id: proposalId },
      data: { status: 'dismissed' },
    } });
  }, [updateProposal]);

  return { applyProposal, dismissProposal };
}
