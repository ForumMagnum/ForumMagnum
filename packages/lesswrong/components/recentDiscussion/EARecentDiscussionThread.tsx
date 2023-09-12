import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { Link } from "../../lib/reactRouterWrapper";
import { useRecentDiscussionThread } from "./useRecentDiscussionThread";
import {
  postGetCommentsUrl,
  postGetPageUrl,
} from "../../lib/collections/posts/helpers";
import type { CommentTreeNode } from "../../lib/utils/unflatten";

const styles = (_theme: ThemeType) => ({
  header: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
  },
  postInfo: {
    flexGrow: 1,
  },
  karmaDisplay: {
    marginLeft: 6,
    marginRight: 14,
  },
  postTitle: {
    marginBottom: 4,
  },
  commentCount: {
    display: "flex",
    gap: "4px",
    "& svg": {
      fontSize: 18,
    },
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
    EARecentDiscussionItem, EAPostMeta, ForumIcon, CommentsNode, EAKarmaDisplay,
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
        <EAKarmaDisplay post={post} className={classes.karmaDisplay} />
        <div className={classes.postInfo}>
          <PostsItemTooltipWrapper post={post} className={classes.postTitle}>
            <Link to={postGetPageUrl(post)}>{post.title}</Link>
          </PostsItemTooltipWrapper>
          <EAPostMeta post={post} />
        </div>
        <Link to={postGetCommentsUrl(post)} className={classes.commentCount}>
          <ForumIcon icon="Comment" />
          {post.commentCount}
        </Link>
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
