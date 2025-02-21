import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import type { CommentTreeOptions } from '../comments/commentTree';

const styles = (theme: ThemeType) => ({})

const isDialogPost = (post: PostsList): post is PostsList & { debate: true } => !!post.debate;

const PostsItemNewCommentsWrapper = ({ terms, classes, post, treeOptions }: {
  terms: CommentsViewTerms,
  classes: ClassesType<typeof styles>,
  post: PostsList,
  treeOptions: CommentTreeOptions,
}) => {
  const { PostsItemNewCommentsList, PostsDialogItemNewCommentsList } = Components

  if (isDialogPost(post)) {
    return <PostsDialogItemNewCommentsList
      terms={terms}
      post={post}
      treeOptions={treeOptions}
    />
  }

  return <PostsItemNewCommentsList
    terms={terms}
    post={post}
    treeOptions={treeOptions}
  />;
};

const PostsItemNewCommentsWrapperComponent = registerComponent(
  'PostsItemNewCommentsWrapper', PostsItemNewCommentsWrapper, {
    styles,
  }
);

declare global {
  interface ComponentTypes {
    PostsItemNewCommentsWrapper: typeof PostsItemNewCommentsWrapperComponent
  }
}
