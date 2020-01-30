import { Components, registerComponent } from 'meteor/vulcan:core';
import { useSingle } from '../../lib/crud/withSingle';
import React from 'react';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments';
import { withStyles, createStyles } from '@material-ui/core/styles';
import { POST_PREVIEW_WIDTH } from './PostsPreviewTooltip';

const styles = createStyles(theme => ({
  loading: {
    width: POST_PREVIEW_WIDTH,
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit
  }
}))

const PostsPreviewTooltipSingle = ({ classes, postId, truncateLimit=600, showAllInfo }) => {
  const { Loading, PostsPreviewTooltip  } = Components

  const { document: post, loading: postLoading } = useSingle({
    collection: Posts,
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network' as any, //TODO
    documentId: postId
  });

  if (postLoading) return <div className={classes.loading}>
      <Loading/>
    </div>
  
  return <PostsPreviewTooltip post={post} showAllInfo={showAllInfo} truncateLimit={truncateLimit} />
}

const PostsPreviewTooltipSingleComponent = registerComponent('PostsPreviewTooltipSingle', PostsPreviewTooltipSingle, withStyles(styles, {name:"PostsPreviewTooltipSingle"}));

const PostsPreviewTooltipSingleWithComment = ({ classes, postId, commentId, truncateLimit=600, showAllInfo }) => {
  const { Loading, PostsPreviewTooltip  } = Components

  const { document: post, loading: postLoading } = useSingle({
    collection: Posts,
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network' as any, //TODO
    documentId: postId
  });

  const { document: comment, loading: commentLoading } = useSingle({
    collection: Comments,
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-then-network' as any, //TODO
    documentId: commentId,
  });

  if (postLoading || commentLoading) return <div className={classes.loading}>
      <Loading/>
    </div>
  
  return <PostsPreviewTooltip post={post} comment={commentId && comment} showAllInfo={showAllInfo} truncateLimit={truncateLimit} />
}

const PostsPreviewTooltipSingleWithCommentComponent = registerComponent('PostsPreviewTooltipSingleWithComment', PostsPreviewTooltipSingleWithComment, withStyles(styles, {name:"PostsPreviewTooltipSingleWithComment"}));

declare global {
  interface ComponentTypes {
    PostsPreviewTooltipSingle: typeof PostsPreviewTooltipSingleComponent
    PostsPreviewTooltipSingleWithComment: typeof PostsPreviewTooltipSingleWithCommentComponent
  }
}

