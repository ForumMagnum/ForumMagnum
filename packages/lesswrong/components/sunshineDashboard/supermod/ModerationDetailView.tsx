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
import type { InboxAction } from './inboxReducer';
import FormatDate from '@/components/common/FormatDate';
import AltAccountInfo from '../ModeratorUserInfo/AltAccountInfo';
import { Link } from '@/lib/reactRouterWrapper';
import { getEnvKeystrokeText } from '@/lib/vendor/ckeditor5-util/keyboard';
import { useUserContentPermissions } from './useUserContentPermissions';

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
    padding: '12px 14px',
    borderBottom: theme.palette.border.normal,
    backgroundColor: theme.palette.grey[50],
    minHeight: 130,
    ...theme.typography.commentStyle,
  },
  headerContent: {
    display: 'flex',
    gap: 60,
    height: 160,
  },
  column1: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flexShrink: 0,
    alignItems: 'flex-start',
    width: 180,
  },
  column2: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    minWidth: 0,
    marginTop: 8,
  },
  column3: {
    flex: 1,
    minWidth: 0,
    marginTop: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  column4: {
    flexShrink: 0,
    marginLeft: 'auto',
  },
  displayNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  displayName: {
    fontSize: 18,
    fontWeight: 600,
    width: 148,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  topMetadata: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
  },
  createdAt: {
    color: theme.palette.grey[600],
    marginBottom: 2,
  },
  karma: {
    color: theme.palette.grey[600],
    marginBottom: 2,
  },
  email: {
    color: theme.palette.grey[600],
    fontSize: 14,
    width: 180,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
  rateLimits: {},
  headerBio: {
    fontSize: 13,
    lineHeight: 1.6,
    color: theme.palette.grey[700],
    ...theme.typography.commentStyle,
    '& a': {
      color: theme.palette.primary.main,
    },
    '& img': {
      maxWidth: '100%',
    },
    overflow: 'auto',
  },
  headerWebsite: {
    fontSize: 13,
    color: theme.palette.primary.main,
    display: 'block',
  },
  sectionTitle: {
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    letterSpacing: '0.5px',
  },
  qualitySignalRow: {
    fontSize: 12,
    color: theme.palette.grey[600],
    maxWidth: 200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
  },
  altAccountRow: {
    fontSize: 12,
    color: theme.palette.grey[600],
  },
  permissionButtonsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 4,
    width: 220,
  },
  permissionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 8px',
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    backgroundColor: theme.palette.background.paper,
    cursor: 'pointer',
    fontSize: 12,
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
      borderColor: theme.palette.grey[400],
    },
    '&.active': {
      backgroundColor: theme.palette.error.light,
      borderColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.error.main,
      },
    },
  },
  permissionButtonLabel: {
    flexGrow: 1,
  },
  keystroke: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 18,
    height: 18,
    fontSize: 10,
    color: theme.palette.grey[600],
    fontFamily: theme.typography.fontFamily,
    backgroundColor: theme.palette.grey[100],
    borderRadius: 3,
    border: `1px solid ${theme.palette.grey[300]}`,
    padding: '0 4px',
    marginLeft: 8,
    '.active &': {
      backgroundColor: theme.palette.error.dark,
      borderColor: theme.palette.error.dark,
      color: theme.palette.error.contrastText,
    },
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
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    fontSize: 13,
    marginLeft: 4,
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

  let contentCount = user[contentCountField] ?? 0;
  if (type === 'posts' && user.shortformFeedId) {
    contentCount -= 1;
  }

  let maxContentCount = user[maxContentCountField] ?? 0;
  if (type === 'posts' && user.shortformFeedId) {
    maxContentCount -= 1;
  }

  const hiddenContentCount = maxContentCount - contentCount;
  const averageContentKarma = items.length > 0 ? getAverageBaseScore(items) : null;

  return (
    <div className={classes.contentSummaryRow}>
      <LWTooltip title={tooltipTitle}>
        <span>
          {contentCount}
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

  const firstClientId = user.associatedClientIds?.[0];

  const {
    toggleDisablePosting,
    toggleDisableCommenting,
    toggleDisableMessaging,
    toggleDisableVoting,
  } = useUserContentPermissions(user, dispatch);

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div className={classes.headerContent}>
          <div className={classes.column1}>
            <div className={classes.displayNameRow}>
              <div className={classes.displayName}>
                <UsersName user={user} />
              </div>
              <LWTooltip title={user.reviewedByUserId ? "Already reviewed; future content will go live by default" : "Unreviewed; future content will require review before going live"}>
                <ForumIcon icon={user.reviewedByUserId ? "Check" : "Eye"} className={classes.icon} />
              </LWTooltip>
            </div>
            <div className={classes.email}>
              {user.email}
            </div>
            <div className={classes.topMetadata}>
              {likelyReviewTrigger && (
                <ReviewTriggerBadge badge={likelyReviewTrigger} />
              )}
              <div className={classes.createdAt}>
                <FormatDate date={user.createdAt} />
              </div>
              <div className={classes.karma}>
                {user.karma} karma
              </div>
            </div>
            {firstClientId?.firstSeenReferrer && (
              <div className={classes.qualitySignalRow}>
                <LWTooltip title={firstClientId.firstSeenReferrer} inlineBlock={false}>
                  <span>
                    Referrer: <a href={firstClientId.firstSeenReferrer} target="_blank" rel="noopener noreferrer">{firstClientId.firstSeenReferrer}</a>
                  </span>
                </LWTooltip>
              </div>
            )}
            {firstClientId?.firstSeenLandingPage && (
              <div className={classes.qualitySignalRow}>
                <LWTooltip title={firstClientId.firstSeenLandingPage} inlineBlock={false}>
                  <span>
                    Landing: <Link to={firstClientId.firstSeenLandingPage}>{firstClientId.firstSeenLandingPage}</Link>
                  </span>
                </LWTooltip>
              </div>
            )}
            {user.altAccountsDetected && (
              <div className={classes.altAccountRow}>
                <AltAccountInfo user={user} />
              </div>
            )}
          </div>
          <div className={classes.column2}>
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
            {(posts.length > 0 || comments.length > 0) && (
              <div className={classes.contentSummary}>
                <ContentSummaryRow user={user} type="posts" items={posts} />
                <ContentSummaryRow user={user} type="comments" items={comments} />
              </div>
            )}
            <div className={classes.permissionButtonsContainer}>
              <div 
                className={classNames(classes.permissionButton, user.postingDisabled && 'active')}
                onClick={toggleDisablePosting}
              >
                <span className={classes.permissionButtonLabel}>Posting</span>
                <span className={classes.keystroke}>{getEnvKeystrokeText('D')}</span>
              </div>
              <div 
                className={classNames(classes.permissionButton, user.allCommentingDisabled && 'active')}
                onClick={toggleDisableCommenting}
              >
                <span className={classes.permissionButtonLabel}>Commenting</span>
                <span className={classes.keystroke}>{getEnvKeystrokeText('C')}</span>
              </div>
              <div 
                className={classNames(classes.permissionButton, user.conversationsDisabled && 'active')}
                onClick={toggleDisableMessaging}
              >
                <span className={classes.permissionButtonLabel}>Messaging</span>
                <span className={classes.keystroke}>{getEnvKeystrokeText('M')}</span>
              </div>
              <div 
                className={classNames(classes.permissionButton, user.votingDisabled && 'active')}
                onClick={() => toggleDisableVoting()}
              >
                <span className={classes.permissionButtonLabel}>Voting</span>
                <span className={classes.keystroke}>{getEnvKeystrokeText('V')}</span>
              </div>
            </div>
          </div>
          {(user.htmlBio || user.website) && (
            <div className={classes.column3}>
              <div className={classes.sectionTitle}>Bio</div>
              {user.htmlBio && (
                <>
                  <div
                    className={classes.headerBio}
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
                </>
              )}
              {user.website && (
                <a
                  href={`https://${user.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes.headerWebsite}
                >
                  {user.website}
                </a>
              )}
            </div>
          )}
          <div className={classes.column4}>
            <div className={classes.rateLimits}>
              <UserAutoRateLimitsDisplay user={user} showKarmaMeta absolute />
            </div>
          </div>
        </div>
      </div>

      {allContent.length > 0 && (
        <div className={classes.contentSection}>
          <div className={classes.contentListContainer}>
            <ModerationContentList
              items={allContent}
              title="Posts & Comments"
              focusedItemId={allContent[focusedContentIndex]?._id ?? null}
              dispatch={dispatch}
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
