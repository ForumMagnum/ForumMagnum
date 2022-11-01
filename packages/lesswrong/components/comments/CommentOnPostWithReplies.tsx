import React, { useCallback, useState } from 'react';
import { useRecordPostView } from "../common/withRecordPostView";
import { CommentWithRepliesProps } from "./CommentWithReplies";
import { Components, registerComponent } from '../../lib/vulcan-lib';

type CommentOnPostWithRepliesProps = Omit<CommentWithRepliesProps, 'lastRead' | 'markAsRead'> & {
  post: PostsBase;
}

const CommentOnPostWithReplies = ({post, ...otherProps}: CommentOnPostWithRepliesProps) => {
  const [lastRead, setLastRead] = useState<Date>(post.lastVisitedAt);
  const { recordPostView } = useRecordPostView(post);

  const markAsRead = useCallback(async () => {
    setLastRead(new Date());
    recordPostView({ post });
  }, [post, recordPostView]);

  const {CommentWithReplies} = Components;

  return <CommentWithReplies post={post} {...otherProps} lastRead={lastRead} markAsRead={markAsRead}/>
};

const CommentOnPostWithRepliesComponent = registerComponent(
  'CommentOnPostWithReplies', CommentOnPostWithReplies
);

declare global {
  interface ComponentTypes {
    CommentOnPostWithReplies: typeof CommentOnPostWithRepliesComponent;
  }
}
