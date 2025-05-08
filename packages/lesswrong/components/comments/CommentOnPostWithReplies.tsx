import React from 'react';
import { CommentWithRepliesProps, CommentWithReplies } from "./CommentWithReplies";
import { registerComponent } from '../../lib/vulcan-lib/components';

type CommentOnPostWithRepliesProps = CommentWithRepliesProps & {
  post: PostsBase;
}

const CommentOnPostWithRepliesInner = ({post, ...otherProps}: CommentOnPostWithRepliesProps) => {
  return <CommentWithReplies post={post} {...otherProps} />
};

export const CommentOnPostWithReplies = registerComponent(
  'CommentOnPostWithReplies', CommentOnPostWithRepliesInner
);

declare global {
  interface ComponentTypes {
    CommentOnPostWithReplies: typeof CommentOnPostWithReplies;
  }
}
