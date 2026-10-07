'use client';

import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import AgentProposalCard from './AgentProposalCard';
import { useApplyModerationProposal } from './useApplyModerationProposal';
import type { InboxAction } from './inboxReducer';

const PendingProposalsForUserQuery = gql(`
  query multiModerationProposalsForUserQuery($selector: ModerationProposalSelector, $limit: Int) {
    moderationProposals(selector: $selector, limit: $limit) {
      results {
        ...ModerationProposalDisplay
      }
    }
  }
`);

const styles = defineStyles('AgentProposalsSection', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 12,
    flexShrink: 0,
    backgroundColor: theme.palette.background.paper,
    borderBottom: theme.palette.border.normal,
  },
  // Matches ModerationContentList's title style, since this section sits
  // directly above the Content column
  heading: {
    ...theme.typography.commentStyle,
    fontSize: 14,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    letterSpacing: '0.5px',
  },
  emptyActions: {
    display: 'flex',
    gap: 8,
  },
  emptyActionButton: {
    ...theme.typography.commentStyle,
    padding: '5px 14px',
    fontSize: 13,
    border: theme.palette.border.normal,
    borderRadius: 4,
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: theme.palette.grey[700],
    '&:hover': {
      color: theme.palette.text.normal,
      backgroundColor: theme.palette.grey[100],
    },
  },
}));

/**
 * Pending agent proposals for the opened user, shown at the top of the
 * moderation sidebar so plans filed in chat are visible (and applicable) even
 * after a reload or from another moderator's session.
 */
const AgentProposalsSection = ({ user, currentUser, posts, comments, addToUndoQueue, dispatch }: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  posts: SunshinePostsList[];
  comments: CommentsListWithParentMetadata[];
  addToUndoQueue: (actionLabel: string, executeAction: () => Promise<void>) => void;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
}) => {
  const classes = useStyles(styles);
  const { data, refetch } = useQuery(PendingProposalsForUserQuery, {
    variables: {
      selector: { proposalsForUser: { targetUserId: user._id, statuses: ['pending'] } },
      limit: 10,
    },
    fetchPolicy: 'cache-and-network',
    ssr: false,
  });

  const { applyProposal, dismissProposal } = useApplyModerationProposal({
    user, currentUser, posts, comments, addToUndoQueue,
  });

  const proposals = data?.moderationProposals?.results ?? [];

  return (
    <div className={classes.root}>
      <div className={classes.heading}>Agent proposals</div>
      {!proposals.length && (
        <div className={classes.emptyActions}>
          <button
            type="button"
            className={classes.emptyActionButton}
            onClick={() => dispatch({
              type: 'GENERATE_IN_AGENT_CHAT',
              message: 'Review this user and file a moderation proposal with your recommended actions.',
            })}
          >
            Generate
          </button>
          <button
            type="button"
            className={classes.emptyActionButton}
            onClick={() => dispatch({ type: 'FOCUS_AGENT_CHAT' })}
          >
            Discuss
          </button>
        </div>
      )}
      {proposals.map((proposal) => (
        <AgentProposalCard
          key={proposal._id}
          proposal={proposal}
          posts={posts}
          comments={comments}
          canApply
          onApply={(selectedIndexes) => applyProposal(proposal, selectedIndexes)}
          onDismiss={() => {
            void dismissProposal(proposal._id).then(() => refetch());
          }}
          onDiscuss={() => dispatch({
            type: 'DISCUSS_IN_AGENT_CHAT',
            message: `Discussing the proposal "${proposal.title ?? proposal._id}" — its steps and rationale are already in the agent's context, so just ask about it.`,
          })}
          onVoiceSubmit={(transcript) => dispatch({
            type: 'GENERATE_IN_AGENT_CHAT',
            message: `Regarding the proposal "${proposal.title ?? proposal._id}": ${transcript}`,
            newConversation: true,
          })}
        />
      ))}
    </div>
  );
};

export default AgentProposalsSection;
