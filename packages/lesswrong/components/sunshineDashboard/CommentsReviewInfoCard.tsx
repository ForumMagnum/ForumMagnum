import React from 'react';
import { unflattenComments } from '../../lib/utils/unflatten';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  },
  bigDownvotes: {
    color: theme.palette.error.dark,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
    fontWeight: 600,
  },
  downvotes: {
    color: theme.palette.error.dark,
    opacity: .75,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
  },
  upvotes: {
    color: theme.palette.primary.dark,
    opacity: .75,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
  },
  bigUpvotes: {
    color: theme.palette.primary.dark,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
    fontWeight: 600,
  },
  votesRow: {
    marginTop: 12,
    marginBottom: 12
  },
});

const getVoteDistribution = ({ allVotes }: { allVotes: { voteType: string }[] }) => {
  const voteCounts = {
    smallUpvote: 0,
    smallDownvote: 0,
    bigUpvote: 0,
    bigDownvote: 0,
    neutral: 0
  };

  return allVotes.reduce((prev, curr) => {
    prev[curr.voteType]++;
    return prev;
  }, voteCounts);
}

export const CommentsReviewInfoCard = ({ commentModeratorAction, classes }: {
  commentModeratorAction: CommentModeratorActionDisplay,
  classes: ClassesType,
}) => {
  const { CommentWithReplies, LWTooltip } = Components;
  const { comment } = commentModeratorAction;
  const commentVotes = getVoteDistribution(comment);
  const [commentTreeNode] = unflattenComments([comment]);

  const votesRow = <div className={classes.votesRow}>
    <span>Votes: </span>
    <LWTooltip title="Big Upvotes">
        <span className={classes.bigUpvotes}>
          { commentVotes.bigUpvote }
        </span>
    </LWTooltip>
    <LWTooltip title="Upvotes">
        <span className={classes.upvotes}>
          { commentVotes.smallUpvote }
        </span>
    </LWTooltip>
    <LWTooltip title="Downvotes">
        <span className={classes.downvotes}>
          { commentVotes.smallDownvote }
        </span>
    </LWTooltip>
    <LWTooltip title="Big Downvotes">
        <span className={classes.bigDownvotes}>
          { commentVotes.bigDownvote }
        </span>
    </LWTooltip>
  </div>;

  return <div className={classes.root}>
    {votesRow}
    <CommentWithReplies
      post={comment.post ?? undefined}
      commentNodeProps={{
        karmaCollapseThreshold: -9000
      }}
      comment={commentTreeNode.item}
    />
  </div>;
}

const CommentsReviewInfoCardComponent = registerComponent('CommentsReviewInfoCard', CommentsReviewInfoCard, {styles});

declare global {
  interface ComponentTypes {
    CommentsReviewInfoCard: typeof CommentsReviewInfoCardComponent
  }
}

