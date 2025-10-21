import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import CommentsNode from '@/components/comments/CommentsNode';
import PostsPageWrapper from '@/components/posts/PostsPage/PostsPageWrapper';

const styles = defineStyles('ModerationContentDetail', (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    height: '100%',
    overflowY: 'auto',
    width: 800,
    flexShrink: 0,
  },
  empty: {
    padding: 40,
    textAlign: 'center',
    color: theme.palette.grey[600],
    fontSize: 14,
  },
}));

type ContentItem = SunshinePostsList | CommentsListWithParentMetadata;

const isPost = (item: ContentItem): item is SunshinePostsList => {
  return 'title' in item && item.title !== null;
};

const ModerationContentDetail = ({
  item,
}: {
  item: ContentItem | null;
}) => {
  const classes = useStyles(styles);

  if (!item) {
    return (
      <div className={classes.root}>
        <div className={classes.empty}>
          Select a post or comment to view details
        </div>
      </div>
    );
  }

  const post = isPost(item);

  return (
    <div className={classes.root}>
      {post
        ? <PostsPageWrapper documentId={item._id} sequenceId={null} embedded/>
        : <CommentsNode treeOptions={{showPostTitle: true}} comment={item} forceUnTruncated forceUnCollapsed/>}
    </div>
  );
};

export default ModerationContentDetail;

