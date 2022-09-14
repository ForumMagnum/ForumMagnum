import React from 'react';
import { useMarkAsRead } from "../common/withRecordPostView";
import { CommentWithRepliesProps } from "./CommentWithReplies";
import { Components, registerComponent } from '../../lib/vulcan-lib';

interface CommentOnPostWithRepliesProps extends CommentWithRepliesProps {
  post: PostsBase;
}

const CommentOnPostWithReplies = (props: CommentOnPostWithRepliesProps) => {
  const {lastRead, markAsRead} = useMarkAsRead(props.post);

  const {CommentWithReplies} = Components;

  return <CommentWithReplies {...props} lastRead={lastRead} markAsRead={markAsRead}/>
};

const CommentOnPostWithRepliesComponent = registerComponent(
  'CommentOnPostWithReplies', CommentOnPostWithReplies
);

declare global {
  interface ComponentTypes {
    CommentOnPostWithReplies: typeof CommentOnPostWithRepliesComponent;
  }
}