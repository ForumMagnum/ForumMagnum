import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useRecentDiscussionThread } from "./useRecentDiscussionThread";
import type { CommentTreeNode } from "../../lib/utils/unflatten";

const styles = (_theme: ThemeType) => ({
  header: {
    display: "flex",
    width: "100%",
  },
});

const EARecentDiscussionThread = ({
  post,
  comments,
  refetch,
  expandAllThreads: initialExpandAllThreads,
  classes,
}: {
  post: PostsRecentDiscussion,
  comments?: CommentsList[],
  refetch: () => void,
  expandAllThreads?: boolean,
  classes: ClassesType,
}) => {
  const {
    isSkippable,
    showHighlight,
    expandAllThreads,
    lastVisitedAt,
    nestedComments,
    treeOptions,
  } = useRecentDiscussionThread({
    post,
    comments,
    refetch,
    initialExpandAllThreads,
  });

  if (isSkippable) {
    return null;
  }

  if (!comments?.length) {
    // TODO: Display new post?
    return null;
  }

  const {
    EARecentDiscussionItem, EAPostMeta, ForumIcon, CommentsNode,
    PostsItemTooltipWrapper,
  } = Components;
  return (
    <EARecentDiscussionItem
      icon="RecentDiscussionComment"
      user={comments[0].user}
      description="commented on"
      post={post}
      timestamp={comments[0].postedAt}
    >
      <div className={classes.header}>
        <div>
          {post.baseScore}
        </div>
        <div>
          <PostsItemTooltipWrapper post={post}>
            {post.title}
          </PostsItemTooltipWrapper>
          <EAPostMeta post={post} />
        </div>
        <div>
          <ForumIcon icon="Comment" />
          {post.commentCount}
        </div>
      </div>
      <div dangerouslySetInnerHTML={{__html: post.contents?.htmlHighlight ?? ""}} />
      {nestedComments.map((comment: CommentTreeNode<CommentsList>) =>
        <div key={comment.item._id}>
          <CommentsNode
            treeOptions={treeOptions}
            startThreadTruncated={true}
            expandAllThreads={expandAllThreads}
            expandNewComments={false}
            nestingLevel={1}
            comment={comment.item}
            childComments={comment.children}
          />
        </div>
      )}
    </EARecentDiscussionItem>
  );
}

const EARecentDiscussionThreadComponent = registerComponent(
  "EARecentDiscussionThread",
  EARecentDiscussionThread,
  {styles},
);

declare global {
  interface ComponentTypes {
    EARecentDiscussionThread: typeof EARecentDiscussionThreadComponent,
  }
}
