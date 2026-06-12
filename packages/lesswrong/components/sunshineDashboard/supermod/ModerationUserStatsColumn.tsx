'use client';

import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import ForumIcon from '@/components/common/ForumIcon';
import ContentSummary from './ContentSummary';
import Row from '@/components/common/Row';
import LWTooltip from '@/components/common/LWTooltip';

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
  signalBadges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    fontSize: 11,
  },
  signalBadge: {
    padding: '2px 6px',
    borderRadius: 3,
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[700],
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  highRiskSignalBadge: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.dark,
  },
}));

type ModeratedContentItem = SunshinePostsList | SunshineCommentsList;

function getMaxPangramScore(contentItems: ModeratedContentItem[]) {
  const scores = contentItems
    .map(item => item.automatedContentEvaluations?.pangramScore)
    .filter((score): score is number => typeof score === 'number');

  if (!scores.length) return null;
  return Math.max(...scores);
}

function getRejectedContentCount(contentItems: ModeratedContentItem[]) {
  return contentItems.filter(item => item.rejected).length;
}

const ModerationUserStatsColumn = ({
  user,
  posts,
  comments,
}: {
  user: SunshineUsersList;
  posts: SunshinePostsList[];
  comments: SunshineCommentsList[];
}) => {
  const classes = useStyles(styles);
  const loadedContent = [...posts, ...comments];
  const loadedContentCount = loadedContent.length;
  const rejectedLoadedContentCount = getRejectedContentCount(loadedContent);
  const allLoadedContentRejected = loadedContentCount > 0 && rejectedLoadedContentCount === loadedContentCount;
  const maxPangramScore = getMaxPangramScore(loadedContent);
  const hasHighPangramScore = maxPangramScore !== null && maxPangramScore >= 0.25;
  const showSignalBadges = loadedContentCount > 0 && (maxPangramScore !== null || rejectedLoadedContentCount > 0);

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
      {showSignalBadges && (
        <div className={classes.signalBadges}>
          {maxPangramScore !== null && (
            <LWTooltip title="Highest Pangram score among currently loaded posts and comments">
              <span className={classNames(classes.signalBadge, hasHighPangramScore && classes.highRiskSignalBadge)}>
                LLM max {maxPangramScore.toFixed(2)}
              </span>
            </LWTooltip>
          )}
          {rejectedLoadedContentCount > 0 && (
            <LWTooltip title="Rejected posts and comments among currently loaded content">
              <span className={classNames(classes.signalBadge, allLoadedContentRejected && classes.highRiskSignalBadge)}>
                {allLoadedContentRejected ? 'All loaded rejected' : `Rejected ${rejectedLoadedContentCount}/${loadedContentCount}`}
              </span>
            </LWTooltip>
          )}
        </div>
      )}
      {(posts.length > 0 || comments.length > 0) && (
        <ContentSummary user={user} posts={posts} comments={comments} />
      )}
    </div>
  );
};

export default ModerationUserStatsColumn;
