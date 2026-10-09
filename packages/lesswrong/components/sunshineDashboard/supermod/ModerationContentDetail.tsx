import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import CommentsNode from '@/components/comments/CommentsNode';
import { isMapPin, isPost, type ModerationContentItem } from './helpers';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import PostBodyPrefix from '@/components/posts/PostsPage/PostBodyPrefix';
import ContentStyles from '@/components/common/ContentStyles';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import PostActionsButton from '@/components/dropdowns/posts/PostActionsButton';
import { ModerationMapPinDetail } from './ModerationMapPin';
import ModerationCommentPostContext from './ModerationCommentPostContext';

const styles = defineStyles('ModerationContentDetail', (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    flex: 1,
    minWidth: 0,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  contentWrapper: {
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
  },
  empty: {
    padding: 40,
    textAlign: 'center',
    color: theme.palette.grey[600],
    fontSize: 14,
  },
  commentsNode: {
    overflow: 'hidden',
    '& .comments-node': {
      borderTop: 'unset',
      borderLeft: 'unset',
      borderRight: 'unset',
    }
  },
  postContent: {
    padding: 16,
    borderLeft: `1px solid ${theme.palette.grey[300]}`,
  },
  postTitleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  postTitle: {
    display: 'block',
    ...theme.typography.headerStyle,
    fontSize: 38,
    flexGrow: 1,
    minWidth: 0,
  },
  postActionsButton: {
    flexShrink: 0,
    marginTop: 8,
    color: theme.palette.grey[600],
  },
  draftNotice: {
    fontSize: 20,
    color: theme.palette.grey[700],
    marginBottom: 4,
  }
}));
const ModerationContentDetail = ({
  item,
}: {
  item: ModerationContentItem | null;
}) => {
  const classes = useStyles(styles);
  if (!item) {
    return (
      <div className={classes.root}>
        <div className={classes.contentWrapper}>
          <div className={classes.empty}>
            Select content to view details
          </div>
        </div>
      </div>
    );
  }

  if (isMapPin(item)) {
    return <div className={classes.root}>
      <div className={classes.contentWrapper}>
        <ModerationMapPinDetail item={item} />
      </div>
    </div>;
  }

  const post = isPost(item);

  return (
    <div className={classes.root}>
      <div className={classes.contentWrapper}>
        {post
          ? <div className={classes.postContent}>
            {item.draft && <div className={classes.draftNotice}>[Draft]</div>}
            <div className={classes.postTitleRow}>
              <Link to={postGetPageUrl(item)} className={classes.postTitle}>
                {item.title}
              </Link>
              <PostActionsButton post={item} vertical flip className={classes.postActionsButton} />
            </div>
            <PostBodyPrefix post={item} />
            <ContentStyles contentType="postHighlight">
              <ContentItemBody
                dangerouslySetInnerHTML={{__html: item.contents?.html ?? ''}}
              />
            </ContentStyles>
          </div>
          : <div className={classes.commentsNode}>
            {item.postId && <ModerationCommentPostContext postId={item.postId} showOpeningText={!item.parentCommentId} />}
            <CommentsNode treeOptions={{showPostTitle: !item.postId}} comment={item} forceUnTruncated forceUnCollapsed showParentDefault/>
            </div>
          }
      </div>
    </div>
  );
};

export default ModerationContentDetail;
