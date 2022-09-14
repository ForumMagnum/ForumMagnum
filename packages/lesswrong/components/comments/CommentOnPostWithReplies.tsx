import React, { useCallback, useState } from 'react';
import { useRecordPostView } from "../common/withRecordPostView";
import { CommentWithRepliesProps } from "./CommentWithReplies";
import { Components, registerComponent } from '../../lib/vulcan-lib';

interface CommentOnPostWithRepliesProps extends CommentWithRepliesProps {
  post: PostsBase;
}

const CommentOnPostWithReplies = (props: CommentOnPostWithRepliesProps) => {
  const post = props.post;
  const [lastRead, setLastRead] = useState<Date>(post.lastVisitedAt);
  const { recordPostView } = useRecordPostView(post);

  const markAsRead = useCallback(async () => {
    setLastRead(new Date());
    recordPostView({ post });
  }, [post, recordPostView]);

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
