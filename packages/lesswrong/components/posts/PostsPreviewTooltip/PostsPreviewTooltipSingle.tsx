import React from 'react';
import { useSingle } from '../../../lib/crud/withSingle';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { POST_PREVIEW_WIDTH } from './LWPostsPreviewTooltip';

export const notificationLoadingStyles = (theme: ThemeType): JssStyles => ({
  width: POST_PREVIEW_WIDTH,
  paddingTop: theme.spacing.unit,
  paddingBottom: theme.spacing.unit
})

const styles = (theme: ThemeType): JssStyles => ({
  loading: {
    ...notificationLoadingStyles(theme)
  }
})

const PostsPreviewTooltipSingle = ({ classes, postId, truncateLimit=600, postsList=false }: {
  classes: ClassesType,
  postId: string,
  truncateLimit?: number,
  postsList?: boolean
}) => {
  const { Loading, PostsPreviewTooltip  } = Components

  const { document: post, loading: postLoading } = useSingle({
    collectionName: "Posts",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network' as any, //TODO
    documentId: postId
  });

  if (postLoading) return <div className={classes.loading}>
      <Loading/>
    </div>

  if (!post) {return null;}

  return <PostsPreviewTooltip post={post} postsList={postsList}/>
}

const PostsPreviewTooltipSingleComponent = registerComponent('PostsPreviewTooltipSingle', PostsPreviewTooltipSingle, {styles});

const PostsPreviewTooltipSingleWithComment = ({ classes, postId, commentId, truncateLimit=600 }: {
  classes: ClassesType,
  postId: string,
  commentId: string,
  truncateLimit?: number,
}) => {
  const { Loading, PostsPreviewTooltip  } = Components

  const { document: post, loading: postLoading } = useSingle({
    collectionName: "Posts",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-then-network' as any, //TODO
    documentId: postId
  });

  const { document: comment, loading: commentLoading } = useSingle({
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-then-network' as any, //TODO
    documentId: commentId,
  });

  if (postLoading || commentLoading) return <div className={classes.loading}>
      <Loading/>
    </div>

  if (!post) {return null;}
  
  return <PostsPreviewTooltip post={post} comment={commentId && comment} />
}

const PostsPreviewTooltipSingleWithCommentComponent = registerComponent(
  'PostsPreviewTooltipSingleWithComment', PostsPreviewTooltipSingleWithComment, {
    styles
  }
);

const TaggedPostTooltipSingle = ({tagRelId, classes}:{
    tagRelId:string,
    classes: ClassesType
  }) => {
  const { document: tagRel, loading: tagRelLoading } = useSingle({
    collectionName: "TagRels",
    fragmentName: 'TagRelFragment',
    fetchPolicy: 'cache-then-network' as any, //TODO
    documentId: tagRelId,
  });

  const { PostsPreviewTooltip, Loading } = Components
  if (tagRelLoading) return <div className={classes.loading}>
    <Loading/>
  </div>
  if (!tagRel) {return null;}
  return <PostsPreviewTooltip post={tagRel.post} />
}

const TaggedPostTooltipSingleComponent = registerComponent('TaggedPostTooltipSingle', TaggedPostTooltipSingle, {styles})

declare global {
  interface ComponentTypes {
    PostsPreviewTooltipSingle: typeof PostsPreviewTooltipSingleComponent
    PostsPreviewTooltipSingleWithComment: typeof PostsPreviewTooltipSingleWithCommentComponent
    TaggedPostTooltipSingle: typeof TaggedPostTooltipSingleComponent
  }
}

