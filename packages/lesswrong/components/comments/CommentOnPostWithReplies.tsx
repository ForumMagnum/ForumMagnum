import React from 'react';
import CommentWithReplies, { CommentWithRepliesProps } from "./CommentWithReplies";
import { registerComponent } from '../../lib/vulcan-lib/components';

type CommentOnPostWithRepliesProps = CommentWithRepliesProps & {
  post: PostsBase;
}

const CommentOnPostWithReplies = ({post, ...otherProps}: CommentOnPostWithRepliesProps) => {
  return <CommentWithReplies post={post} {...otherProps} />
};

export default registerComponent(
  'CommentOnPostWithReplies', CommentOnPostWithReplies
);


