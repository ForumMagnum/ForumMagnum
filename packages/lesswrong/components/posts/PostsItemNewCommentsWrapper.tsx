import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { CommentTreeOptions } from '../comments/commentTree';
import { PostsItemNewCommentsList } from "./PostsItemNewCommentsList";
import { PostsDialogItemNewCommentsList } from "./PostsDialogItemNewCommentsList";

const styles = (theme: ThemeType) => ({})

const isDialogPost = (post: PostsList): post is PostsList & { debate: true } => !!post.debate;

const PostsItemNewCommentsWrapperInner = ({ terms, classes, post, treeOptions }: {
  terms: CommentsViewTerms,
  classes: ClassesType<typeof styles>,
  post: PostsList,
  treeOptions: CommentTreeOptions,
}) => {
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

export const PostsItemNewCommentsWrapper = registerComponent(
  'PostsItemNewCommentsWrapper', PostsItemNewCommentsWrapperInner, {
    styles,
  }
);


