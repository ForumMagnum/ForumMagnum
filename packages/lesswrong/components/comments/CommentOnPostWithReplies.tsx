import React from 'react';
import CommentWithReplies, { CommentWithRepliesProps } from "./CommentWithReplies";

type CommentOnPostWithRepliesProps = CommentWithRepliesProps & {
  post: PostsBase;
}

const CommentOnPostWithReplies = ({post, ...otherProps}: CommentOnPostWithRepliesProps) => {
  return <CommentWithReplies post={post} {...otherProps} />
};

export default CommentOnPostWithReplies;
