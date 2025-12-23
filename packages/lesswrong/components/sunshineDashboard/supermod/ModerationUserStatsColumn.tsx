import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import ForumIcon from '@/components/common/ForumIcon';
import ContentSummary from './ContentSummary';
import Row from '@/components/common/Row';

const sharedVoteStyles = {
  marginLeft: 4,
  marginRight: 4,
  borderRadius: "50%",
};

const styles = defineStyles('ModerationUserStatsColumn', (theme: ThemeType) => ({
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    minWidth: 0,
    marginTop: 8,
  },
  contentCounts: {
    color: theme.palette.grey[600],
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    gap: 8,
    fontSize: 13,
  },
  contentCountItem: {
    display: 'flex',
    alignItems: 'flex-start',
  },
  deemphasizedContentCountItem: {
    opacity: 0.5,
  },
  icon: {
    height: 13,
    color: theme.palette.grey[500],
    position: "relative",
    top: 2
  },
  votesRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
    marginBottom: 2,
  },
  deemphasizedVotesRow: {
    opacity: 0.3,
  },
  votesLabel: {
    marginLeft: 4,
  },
  bigDownvotes: {
    color: theme.palette.error.dark,
    ...sharedVoteStyles,
    fontWeight: 600,
  },
  downvotes: {
    color: theme.palette.error.dark,
    opacity: .75,
    ...sharedVoteStyles,
  },
  upvotes: {
    color: theme.palette.primary.dark,
    opacity: .75,
    ...sharedVoteStyles,
  },
  bigUpvotes: {
    color: theme.palette.primary.dark,
    ...sharedVoteStyles,
    fontWeight: 600,
  },
}));

const ModerationUserStatsColumn = ({
  user,
  posts,
  comments,
}: {
  user: SunshineUsersList;
  posts: SunshinePostsList[];
  comments: CommentsListWithParentMetadata[];
}) => {
  const classes = useStyles(styles);

  return (
    <div className={classes.column}>
      <Row justifyContent="flex-start">
        <div className={classes.contentCounts}>
          <span className={classNames(classes.contentCountItem, !user.usersContactedBeforeReview?.length && classes.deemphasizedContentCountItem)}>
            <ForumIcon icon="Email" className={classes.icon} />
            {user.usersContactedBeforeReview?.length ?? 0}
          </span>
          <span className={classNames(classes.contentCountItem, !user.rejectedContentCount && classes.deemphasizedContentCountItem)}>
            <ForumIcon icon="NotInterested" className={classes.icon} />
            {user.rejectedContentCount}
          </span>
        </div>
        <div className={classNames(classes.votesRow, !user.bigUpvoteCount && !user.smallUpvoteCount && !user.smallDownvoteCount && !user.bigDownvoteCount && classes.deemphasizedVotesRow)}>
          <span className={classes.votesLabel}>Votes:</span>
          <span className={classes.bigUpvotes}>
            {user.bigUpvoteCount ?? 0}
          </span>
          <span className={classes.upvotes}>
            {user.smallUpvoteCount ?? 0}
          </span>
          <span className={classes.downvotes}>
            {user.smallDownvoteCount ?? 0}
          </span>
          <span className={classes.bigDownvotes}>
            {user.bigDownvoteCount ?? 0}
          </span>
        </div>
      </Row>
      {(posts.length > 0 || comments.length > 0) && (
        <ContentSummary user={user} posts={posts} comments={comments} />
      )}
    </div>
  );
};

export default ModerationUserStatsColumn;

