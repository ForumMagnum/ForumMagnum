import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { unflattenComments } from '../../lib/utils/unflatten';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { commentGetPageUrlFromIds } from '../../lib/collections/comments/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor: theme.palette.grey[0],
    boxShadow: theme.palette.boxShadow.eventCard,
    marginBottom: 16,
    ...theme.typography.body2,
    fontSize: "1rem",
    width: 730
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
  infoRow: {
    padding: 16,
    paddingBottom: 8,
    borderBottom: theme.palette.border.slightlyIntense
  },
  nestedInfoRow: {
    paddingBottom: 4
  },
  commentsRow: {
    padding: 8,
    width: 720
  },
  seeInContext: {
    ...theme.typography.commentStyle,
    textAlign: "right",
    color: theme.palette.lwTertiary.main,
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

interface CommentWithModeratorActions {
  comment: CommentsListWithModerationMetadata;
  actions: Omit<CommentModeratorActionDisplay, 'comment'>[];
}

export const CommentsReviewInfoCard = ({ commentModeratorAction, classes }: {
  commentModeratorAction: CommentWithModeratorActions,
  classes: ClassesType,
}) => {
  const { CommentWithReplies, LWTooltip } = Components;
  const { comment, actions } = commentModeratorAction;
  const commentVotes = getVoteDistribution(comment);
  const [commentTreeNode] = unflattenComments([comment]);

  const seeInContextUrl = `${commentGetPageUrlFromIds({ postId: comment.postId, commentId: comment._id })}#${comment._id}`;
  const seeInContextLink = <Link className={classes.seeInContext} to={seeInContextUrl}>
    See in context
  </Link>;

  const infoRow = <div className={classes.infoRow}>
    <div className={classes.nestedInfoRow}>
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
    </div>
    <div className={classes.nestedInfoRow}>
      {actions.map(action => action.type)}
    </div>
    <div className={classes.nestedInfoRow}>
      {seeInContextLink}
    </div>
  </div>

  const commentsRow = <div className={classes.commentsRow}>
    <CommentWithReplies
      post={comment.post ?? undefined}
      commentNodeProps={{
        karmaCollapseThreshold: -9000,
        showParentDefault: true,
        treeOptions: {
          moderatedCommentId: commentTreeNode.item._id
        },
        startThreadTruncated: false
      }}
      comment={commentTreeNode.item}
    />
  </div>;

  return <div className={classes.root}>
    {infoRow}
    {commentsRow}
  </div>;
}

const CommentsReviewInfoCardComponent = registerComponent('CommentsReviewInfoCard', CommentsReviewInfoCard, {styles});

declare global {
  interface ComponentTypes {
    CommentsReviewInfoCard: typeof CommentsReviewInfoCardComponent
  }
}

