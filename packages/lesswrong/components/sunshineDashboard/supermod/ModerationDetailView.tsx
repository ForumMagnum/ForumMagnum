import React, { useState, useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import UsersName from '@/components/users/UsersName';
import { truncate } from '@/lib/editor/ellipsize';
import { useModeratedUserContents } from '@/components/hooks/useModeratedUserContents';
import classNames from 'classnames';
import { getPrimaryDisplayedModeratorAction, partitionModeratorActions } from './groupings';
import ReviewTriggerBadge from './ReviewTriggerBadge';
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description'
import MessageIcon from '@/lib/vendor/@material-ui/icons/src/Message'
import ForumIcon from '@/components/common/ForumIcon';
import PostKarmaWithPreview from '../PostKarmaWithPreview';
import CommentKarmaWithPreview from '../CommentKarmaWithPreview';
import { maybeDate } from '@/lib/utils/dateUtils';
import LWTooltip from '@/components/common/LWTooltip';
import UserAutoRateLimitsDisplay from '../ModeratorUserInfo/UserAutoRateLimitsDisplay';
import ModerationContentList from './ModerationContentList';
import ModerationContentDetail from './ModerationContentDetail';
import type { InboxAction } from './ModerationInbox';
import FormatDate from '@/components/common/FormatDate';

const sharedVoteStyles = {
  marginLeft: 4,
  marginRight: 4,
  borderRadius: "50%",
};

const styles = defineStyles('ModerationDetailView', (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    minHeight: '100vh',
  },
  header: {
    padding: '20px 24px',
    borderBottom: theme.palette.border.normal,
    backgroundColor: theme.palette.grey[50],
    minHeight: 130,
    ...theme.typography.commentStyle,
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 8,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 600,
    marginRight: 36,
  },
  createdAt: {
    fontSize: 14,
    color: theme.palette.grey[600],
    marginRight: 20,
    marginTop: 3,
  },
  karma: {
    fontSize: 14,
    color: theme.palette.grey[600],
    marginRight: 20,
    marginTop: 3,
  },
  email: {
    color: theme.palette.grey[600],
    marginTop: 3,
  },
  metadata: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 16,
    fontSize: 13,
    color: theme.palette.grey[600],
    height: 20,
    position: 'relative',
  },
  contentCounts: {
    color: theme.palette.grey[600],
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    marginBottom: 2,
    gap: 8,
  },
  contentCountItem: {
    display: 'flex',
    alignItems: 'flex-start',
  },
  wideContentCountItem: {
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
  votesLabel: {
    marginLeft: 8,
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
  rateLimits: {
    right: 12,
    position: 'absolute',
  },
  bioSection: {
    ...theme.typography.commentStyle,
  },
  section: {
    paddingTop: 20,
    paddingBottom: 100,
    paddingLeft: 24,
    paddingRight: 24,
    borderBottom: theme.palette.border.faint,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    marginBottom: 12,
    letterSpacing: '0.5px',
  },
  bio: {
    fontSize: 14,
    lineHeight: 1.6,
    color: theme.palette.grey[800],
    '& a': {
      color: theme.palette.primary.main,
    },
    '& img': {
      maxWidth: '100%',
    },
  },
  website: {
    fontSize: 14,
    color: theme.palette.primary.main,
    marginTop: 8,
    display: 'block',
  },
  contentSection: {
    display: 'flex',
    height: 'calc(100vh - 400px)',
    minHeight: 500,
  },
  contentListContainer: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  expandButton: {
    cursor: 'pointer',
    fontSize: 13,
    color: theme.palette.primary.main,
    marginTop: 8,
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  contentSummary: {
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    fontSize: 13,
  },
  contentSummaryRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  summaryIcon: {
    height: 13,
    color: theme.palette.grey[500],
    position: "relative",
    top: 3,
    marginRight: 4,
  },
  averageKarma: {
    color: theme.palette.grey[500],
    fontSize: 13,
    marginLeft: 7,
  },
  hiddenCount: {
    color: theme.palette.grey[500],
    fontSize: 13,
    marginLeft: 4,
  },
}));

const DEFAULT_BIO_WORDCOUNT = 250;
const MAX_BIO_WORDCOUNT = 10000;

function getAverageBaseScore(contentItems: Array<SunshinePostsList | CommentsListWithParentMetadata>) {
  const average = contentItems.reduce((sum, item) => (item.baseScore ?? 0) + sum, 0) / contentItems.length;
  return average.toFixed(1);
};

function sortContentByPostedAt<T extends { postedAt: string }>(contentItems: Array<T>) {
  return contentItems.sort((a, b) => (maybeDate(a.postedAt).getTime() ?? 0) - (maybeDate(b.postedAt).getTime() ?? 0));
}

interface ContentSummaryRowBaseProps {
  user: SunshineUsersList;
}

type ContentSummaryRowProps = ContentSummaryRowBaseProps & (
  | { type: 'posts', items: SunshinePostsList[] }
  | { type: 'comments', items: CommentsListWithParentMetadata[] }
);

const ContentSummaryRow = ({ user, type, items }: ContentSummaryRowProps) => {
  const classes = useStyles(styles);

  const maxContentCountField = type === 'posts' ? 'maxPostCount' : 'maxCommentCount';
  const contentCountField = type === 'posts' ? 'postCount' : 'commentCount';
  const tooltipTitle = type === 'posts' ? 'Post count' : 'Comment count';
  const ContentIconComponent = type === 'posts' ? DescriptionIcon : MessageIcon;

  const hiddenContentCount = user[maxContentCountField] - user[contentCountField];
  const averageContentKarma = items.length > 0 ? getAverageBaseScore(items) : null;

  return (
    <div className={classes.contentSummaryRow}>
      <LWTooltip title={tooltipTitle}>
        <span>
          {user[contentCountField] || 0}
          <ContentIconComponent className={classes.summaryIcon} />
        </span>
      </LWTooltip>
      {type === 'posts' ? (
        sortContentByPostedAt(items).map(content => (
          <PostKarmaWithPreview 
            key={content._id} 
            post={content} 
            reviewedAt={maybeDate(user.reviewedAt) ?? undefined} 
            displayTitle={false}
          />
        ))
      ) : (
        sortContentByPostedAt(items).map(content => (
          <CommentKarmaWithPreview 
            key={content._id} 
            comment={content} 
            reviewedAt={maybeDate(user.reviewedAt) ?? undefined} 
            displayTitle={false}
          />
        ))
      )}
      {hiddenContentCount > 0 && (
        <span className={classes.hiddenCount}>
          ({hiddenContentCount} drafted or rejected)
        </span>
      )}
      {averageContentKarma && (
        <LWTooltip title="average karma">
          <span className={classes.averageKarma}>
            {averageContentKarma}
          </span>
        </LWTooltip>
      )}
    </div>
  );
};

const ModerationDetailView = ({ 
  user,
  focusedContentIndex,
  dispatch,
}: {
  user: SunshineUsersList;
  focusedContentIndex: number;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
}) => {
  const classes = useStyles(styles);
  const [bioWordcount, setBioWordcount] = useState(DEFAULT_BIO_WORDCOUNT);

  const { posts, comments } = useModeratedUserContents(user._id);

  const allContent = useMemo(() => [...posts, ...comments].sort((a, b) => 
    new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  ), [posts, comments]);

  const focusedContent = useMemo(() => 
    allContent[focusedContentIndex] || null,
    [allContent, focusedContentIndex]
  );

  const { fresh: freshModeratorActions } = partitionModeratorActions(user);
  const likelyReviewTrigger = [...new Set(freshModeratorActions.map(action => getPrimaryDisplayedModeratorAction(action.type)))].reverse().at(0);

  const truncatedHtml = truncate(user.htmlBio, bioWordcount, 'words');
  const bioNeedsTruncation = user.htmlBio && user.htmlBio.length > truncatedHtml.length;

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div className={classes.headerTop}>
          <div className={classes.displayName}>
            <UsersName user={user} />
          </div>
          <div className={classes.createdAt}>
            <FormatDate date={user.createdAt} />
          </div>
          <div className={classes.karma}>
            {user.karma} karma
          </div>
          <div className={classes.email}>
            {user.email}
          </div>
        </div>
        <div className={classes.metadata}>
          {likelyReviewTrigger && (
            <ReviewTriggerBadge badge={likelyReviewTrigger} />
          )}
          <div className={classes.contentCounts}>
            <span className={classNames(classes.contentCountItem, !user.usersContactedBeforeReview?.length && classes.deemphasizedContentCountItem)}>
              <ForumIcon icon="Email" className={classes.icon} />
              {user.usersContactedBeforeReview?.length ?? 0}
            </span>
            <span className={classNames(classes.contentCountItem, !user.rejectedContentCount && classes.deemphasizedContentCountItem)}>
              <ForumIcon icon="NotInterested" className={classes.icon} />
              {user.rejectedContentCount}
            </span>
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
          <div className={classes.rateLimits}>
            <UserAutoRateLimitsDisplay user={user} showKarmaMeta absolute />
          </div>
        </div>
        {(posts.length > 0 || comments.length > 0) && (
          <div className={classes.contentSummary}>
            {posts.length > 0 && <ContentSummaryRow user={user} type="posts" items={posts} />}
            {comments.length > 0 && <ContentSummaryRow user={user} type="comments" items={comments} />}
          </div>
        )}
      </div>

      {(user.htmlBio || user.website) && (
        <div className={classNames(classes.section, classes.bioSection)}>
          <div className={classes.sectionTitle}>About</div>
          {user.htmlBio && (
            <div>
              <div
                className={classes.bio}
                dangerouslySetInnerHTML={{ __html: truncatedHtml }}
                onClick={() => bioNeedsTruncation && setBioWordcount(MAX_BIO_WORDCOUNT)}
              />
              {bioNeedsTruncation && bioWordcount < MAX_BIO_WORDCOUNT && (
                <div
                  className={classes.expandButton}
                  onClick={() => setBioWordcount(MAX_BIO_WORDCOUNT)}
                >
                  Show more
                </div>
              )}
            </div>
          )}
          {user.website && (
            <a
              href={`https://${user.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className={classes.website}
            >
              {user.website}
            </a>
          )}
        </div>
      )}

      {allContent.length > 0 && (
        <div className={classes.contentSection}>
          <div className={classes.contentListContainer}>
            <ModerationContentList
              items={allContent}
              title="Posts & Comments"
              focusedItemId={allContent[focusedContentIndex]?._id ?? null}
            />
          </div>
          <ModerationContentDetail
            item={focusedContent}
          />
        </div>
      )}
    </div>
  );
};

export default ModerationDetailView;
