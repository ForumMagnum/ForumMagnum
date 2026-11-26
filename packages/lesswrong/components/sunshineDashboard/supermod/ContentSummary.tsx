import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description'
import MessageIcon from '@/lib/vendor/@material-ui/icons/src/Message'
import PostKarmaWithPreview from '../PostKarmaWithPreview';
import CommentKarmaWithPreview from '../CommentKarmaWithPreview';
import { maybeDate } from '@/lib/utils/dateUtils';
import LWTooltip from '@/components/common/LWTooltip';

const styles = defineStyles('ContentSummary', (theme: ThemeType) => ({
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

function getAverageBaseScore(contentItems: Array<SunshinePostsList | CommentsListWithParentMetadata>) {
  const average = contentItems.reduce((sum, item) => (item.baseScore ?? 0) + sum, 0) / contentItems.length;
  return average.toFixed(1);
}

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

interface ContentSummaryProps {
  user: SunshineUsersList;
  posts: SunshinePostsList[];
  comments: CommentsListWithParentMetadata[];
}

const ContentSummary = ({ user, posts, comments }: ContentSummaryProps) => {
  const classes = useStyles(styles);

  return (
    <div className={classes.contentSummary}>
      <ContentSummaryRow user={user} type="posts" items={posts} />
      <ContentSummaryRow user={user} type="comments" items={comments} />
    </div>
  );
};

export default ContentSummary;

