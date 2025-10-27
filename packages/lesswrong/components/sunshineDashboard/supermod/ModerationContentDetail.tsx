import React, { useCallback, useRef } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import CommentsNode from '@/components/comments/CommentsNode';
import PostsPageWrapper from '@/components/posts/PostsPage/PostsPageWrapper';
import { ContentItem, isPost } from './helpers';
import ForumIcon from '@/components/common/ForumIcon';

const styles = defineStyles('ModerationContentDetail', (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    height: 'calc(100vh - 178px)',
    width: 800,
    flexShrink: 0,
    position: 'relative',
  },
  contentWrapper: {
    overflowY: 'auto',
    height: 'calc(100% - 58px)',
  },
  empty: {
    padding: 40,
    textAlign: 'center',
    color: theme.palette.grey[600],
    fontSize: 14,
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: '10vh',
    right: 24,
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: theme.palette.grey[500],
    color: theme.palette.background.paper,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: theme.palette.boxShadow.default,
    transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
    zIndex: 1000,
    '&:hover': {
      backgroundColor: theme.palette.grey[700],
      boxShadow: theme.palette.boxShadow.lwCard,
    },
  },
}));
const ModerationContentDetail = ({
  item,
}: {
  item: ContentItem | null;
}) => {
  const classes = useStyles(styles);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (contentWrapperRef.current) {
      const commentFormElement = contentWrapperRef.current.querySelector('#posts-thread-new-comment');
      if (commentFormElement) {
        commentFormElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, []);

  if (!item) {
    return (
      <div className={classes.root}>
        <div className={classes.contentWrapper} ref={contentWrapperRef}>
          <div className={classes.empty}>
            Select a post or comment to view details
          </div>
        </div>
      </div>
    );
  }

  const post = isPost(item);

  return (
    <div className={classes.root}>
      <div className={classes.contentWrapper} ref={contentWrapperRef}>
        {post
          ? <PostsPageWrapper documentId={item._id} sequenceId={null} embedded/>
          : <CommentsNode treeOptions={{showPostTitle: true}} comment={item} forceUnTruncated forceUnCollapsed/>}
      </div>
      {post && (
        <button 
          className={classes.scrollToBottomButton} 
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
        >
          <ForumIcon icon="NarrowArrowDown" />
        </button>
      )}
    </div>
  );
};

export default ModerationContentDetail;

