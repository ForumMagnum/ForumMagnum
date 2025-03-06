import React from 'react';
import { CommentWithRepliesProps } from "./CommentWithReplies";
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import CommentWithReplies from "@/components/comments/CommentWithReplies";

type CommentOnPostWithRepliesProps = CommentWithRepliesProps & {
  post: PostsBase;
}

const CommentOnPostWithReplies = ({post, ...otherProps}: CommentOnPostWithRepliesProps) => {
  return <CommentWithReplies post={post} {...otherProps} />
};

const CommentOnPostWithRepliesComponent = registerComponent(
  'CommentOnPostWithReplies', CommentOnPostWithReplies
);

declare global {
  interface ComponentTypes {
    CommentOnPostWithReplies: typeof CommentOnPostWithRepliesComponent;
  }
}

export default CommentOnPostWithRepliesComponent;
