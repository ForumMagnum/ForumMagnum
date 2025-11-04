import React, { useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import FormatDate from '@/components/common/FormatDate';
import FlagIcon from '@/lib/vendor/@material-ui/icons/src/Flag';
import { getUserEmail } from '@/lib/collections/users/helpers';
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description'
import MessageIcon from '@/lib/vendor/@material-ui/icons/src/Message'
import { getDisplayedReasonForGroupAssignment, ReviewGroup } from './groupings';
import ForumIcon from '@/components/common/ForumIcon';
import { htmlToTextDefault } from '@/lib/htmlToText';
import { useModeratedUserContents } from '@/components/hooks/useModeratedUserContents';
import ReviewTriggerBadge from './ReviewTriggerBadge';

const styles = defineStyles('ModerationInboxItem', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: theme.palette.border.faint,
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
    },
    ...theme.typography.commentStyle,
    overflow: 'hidden',
    minWidth: 0,
  },
  focused: {
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    paddingLeft: 17, // 20 - 3 to account for border
    backgroundColor: theme.palette.grey[100],
  },
  flagged: {
    backgroundColor: theme.palette.panelBackground.sunshineFlaggedUser,
    '&:hover': {
      backgroundColor: theme.palette.panelBackground.sunshineFlaggedUser,
    },
  },
  displayName: {
    fontSize: 15,
    fontWeight: 500,
    color: theme.palette.grey[900],
    marginRight: 12,
    width: 120,
    minWidth: 100,
    maxWidth: 120,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  karma: {
    fontSize: 13,
    marginRight: 8,
    minWidth: 28,
    textAlign: 'right',
    flexShrink: 0,
  },
  karmaPositive: {
    color: theme.palette.primary.main,
  },
  karmaNegative: {
    color: theme.palette.error.main,
  },
  karmaLow: {
    color: theme.palette.grey[600],
  },
  createdAt: {
    fontSize: 13,
    color: theme.palette.grey[600],
    marginRight: 12,
    width: 24,
    flexShrink: 0,
  },
  icons: {
    display: 'flex',
    alignItems: 'center',
    marginRight: 12,
    width: 20,
    flexShrink: 0,
  },
  flagIcon: {
    height: 14,
    width: 14,
    color: theme.palette.error.main,
    marginLeft: 4,
  },
  email: {
    fontSize: 12,
    color: theme.palette.grey[500],
    marginLeft: 'auto',
    maxWidth: 200,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexShrink: 1,
  },
  contentCounts: {
    color: theme.palette.grey[600],
    display: 'flex',
    flexShrink: 0,
  },
  contentCountItem: {
    width: 36,
  },
  wideContentCountItem: {
    width: 50,
  },
  deemphasizedContentCountItem: {
    opacity: 0.5,
  },
  icon: {
    height: 13,
    width: 13,
    marginRight: 3,
    color: theme.palette.grey[500],
    position: "relative",
    top: 3
  },
  contextualInfo: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    marginRight: 12,
  },
  postPreview: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
  },
  postTitle: {
    fontSize: 14,
    whiteSpace: 'nowrap',
  },
  postContents: {
    fontSize: 13,
    color: theme.palette.grey[600],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  commentContents: {
    fontSize: 13,
    color: theme.palette.grey[600],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  bioPreview: {
    fontSize: 13,
    color: theme.palette.grey[600],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

const PreloadUserContents = ({ user }: { user: SunshineUsersList }) => {
  useModeratedUserContents(user._id);
  return null;
};

const ContentPreview = ({ user }: { user: SunshineUsersList }) => {
  const classes = useStyles(styles);

  const { posts, comments } = useModeratedUserContents(user._id);
  
  const firstUnreviewedPost = useMemo(() => (
    posts
      .sort((a, b) => new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime())
      .filter(post => !post.reviewedByUserId && !post.rejected)
      .at(0)
  ), [posts]);

  const firstUnreviewedComment = useMemo(() => (
    comments
      .sort((a, b) => new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime())
      .filter(comment => !comment.reviewedByUserId && !comment.rejected)
      .at(0)
  ), [comments]);

  if (firstUnreviewedPost) {
    return (
      <div className={classes.postPreview}>
        <div className={classes.postTitle}>{firstUnreviewedPost.title}</div>
        <div className={classes.postContents}>{htmlToTextDefault(firstUnreviewedPost.contents?.html ?? '')}</div>
      </div>
    );
  }

  if (firstUnreviewedComment) {
    return (
      <div className={classes.commentContents}>{htmlToTextDefault(firstUnreviewedComment.contents?.html ?? '')}</div>
    );
  }
  
  return null;
};

const ModerationInboxItem = ({
  user,
  reviewGroup,
  isFocused,
  onOpen,
}: {
  user: SunshineUsersList;
  reviewGroup: ReviewGroup;
  isFocused: boolean;
  onOpen: () => void;
}) => {
  const classes = useStyles(styles);

  const likelyReviewTrigger = getDisplayedReasonForGroupAssignment(user);

  const karma = user.karma;
  const karmaClass = karma < 0 ? classes.karmaNegative : karma < 10 ? classes.karmaLow : classes.karmaPositive;

  const showEmail = !user.reviewedByUserId;

  return (
    <div
      className={classNames(classes.root, {
        [classes.focused]: isFocused,
        [classes.flagged]: user.sunshineFlagged,
      })}
      onClick={onOpen}
    >
      <div className={classes.displayName}>
        {user.displayName}
      </div>
      <div className={classNames(classes.karma, karmaClass)}>
        {karma}
      </div>
      <div className={classes.createdAt}>
        <FormatDate date={user.createdAt} />
      </div>
      <div className={classes.contentCounts}>
        <span className={classNames(classes.contentCountItem, !user.postCount && classes.deemphasizedContentCountItem)}>
          <DescriptionIcon className={classes.icon} />
          {user.postCount}
        </span>
        <span className={classNames(classes.wideContentCountItem, !user.commentCount && classes.deemphasizedContentCountItem)}>
          <MessageIcon className={classes.icon} />
          {user.commentCount}
        </span>
        <span className={classNames(classes.contentCountItem, !user.usersContactedBeforeReview?.length && classes.deemphasizedContentCountItem)}>
          <ForumIcon icon="Email" className={classes.icon} />
          {user.usersContactedBeforeReview?.length ?? 0}
        </span>
        <span className={classNames(classes.contentCountItem, !user.rejectedContentCount && classes.deemphasizedContentCountItem)}>
          <ForumIcon icon="NotInterested" className={classes.icon} />
          {user.rejectedContentCount}
        </span>
      </div>
      <div className={classes.icons}>
        {user.sunshineFlagged && <FlagIcon className={classes.flagIcon} />}
      </div>
      {likelyReviewTrigger && (
        <ReviewTriggerBadge badge={likelyReviewTrigger} />
      )}

      <div className={classes.contextualInfo}>
        {reviewGroup === 'newContent'
          ? <ContentPreview user={user} />
          : <PreloadUserContents user={user} />
        }
        {reviewGroup === 'maybeSpam' && (
          <div className={classes.bioPreview}>{htmlToTextDefault(user.htmlBio)}</div>
        )}
      </div>

      {showEmail && (
        <div className={classes.email}>
          {getUserEmail(user) || 'No email'}
        </div>
      )}
    </div>
  );
};

export default ModerationInboxItem;
