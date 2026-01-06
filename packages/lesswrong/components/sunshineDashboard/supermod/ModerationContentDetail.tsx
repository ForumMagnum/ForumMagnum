import React, { useCallback, useRef } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import CommentsNode from '@/components/comments/CommentsNode';
import { ContentItem, isPost } from './helpers';
import ForumIcon from '@/components/common/ForumIcon';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import PostBodyPrefix from '@/components/posts/PostsPage/PostBodyPrefix';
import ContentStyles from '@/components/common/ContentStyles';
import { ContentItemBody } from '@/components/contents/ContentItemBody';

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
  commentsNode: {
    marginLeft: -1,
    marginRight: -1,
    marginTop: -1,
    marginBottom: -1,
    overflow: 'hidden',
  },
  postContent: {
    padding: 16,
    borderLeft: `1px solid ${theme.palette.grey[300]}`,
  },
  postTitle: {
    display: 'block',
    ...theme.typography.headerStyle,
    fontSize: 32,
    fontWeight: 600,
    marginBottom: 12
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
          ? <div className={classes.postContent}>
            {item.draft && <div className={classes.draftNotice}>[Draft]</div>}
            <Link to={postGetPageUrl(item)} className={classes.postTitle}>
              {item.title}
            </Link>
            <PostBodyPrefix post={item} />
            <ContentStyles contentType="postHighlight">
              <ContentItemBody
                dangerouslySetInnerHTML={{__html: item.contents?.html ?? ''}}
              />
            </ContentStyles>
          </div>
          // ? <PostsPageWrapper documentId={item._id} sequenceId={null} embedded/>
          : <div className={classes.commentsNode}>
            <CommentsNode treeOptions={{showPostTitle: true}} comment={item} forceUnTruncated forceUnCollapsed/>
            </div>
          }
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
