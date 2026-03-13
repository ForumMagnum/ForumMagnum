import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { CommentTreeOptions } from '../comments/commentTree';
import PostsItemNewCommentsList from "./PostsItemNewCommentsList";
import PostsDialogItemNewCommentsList from "./PostsDialogItemNewCommentsList";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('PostsItemNewCommentsWrapper', (theme: ThemeType) => ({}))

const isDialogPost = (post: PostsList): post is PostsList & { debate: true } => !!post.debate;

const PostsItemNewCommentsWrapper = ({terms, post, treeOptions}: {
  terms: CommentsViewTerms,
  post: PostsList,
  treeOptions: CommentTreeOptions,
}) => {
  const classes = useStyles(styles);

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

export default registerComponent(
  'PostsItemNewCommentsWrapper', PostsItemNewCommentsWrapper, {
    styles,
  }
);


