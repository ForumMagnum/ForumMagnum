import React from 'react';
import { CommentWithRepliesProps } from "./CommentWithReplies";
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { PostsBase } from '@/lib/generated/gql-codegen/graphql';

type CommentOnPostWithRepliesProps = CommentWithRepliesProps & {
  post: PostsBase;
}

const CommentOnPostWithReplies = ({post, ...otherProps}: CommentOnPostWithRepliesProps) => {

  const {CommentWithReplies} = Components;

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
