import React from 'react';
import { CommentWithRepliesProps } from "./CommentWithReplies";
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

type CommentOnPostWithRepliesProps = CommentWithRepliesProps & {
  post: PostsBase;
}

const CommentOnPostWithRepliesInner = ({post, ...otherProps}: CommentOnPostWithRepliesProps) => {

  const {CommentWithReplies} = Components;

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
