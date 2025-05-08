import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { Link } from "../../lib/reactRouterWrapper";
import { useRecentDiscussionThread } from "./useRecentDiscussionThread";
import { postGetCommentsUrl } from "../../lib/collections/posts/helpers";
import type { CommentTreeNode } from "../../lib/utils/unflatten";
import type { EARecentDiscussionItemProps } from "./EARecentDiscussionItem";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  header: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: 15,
  },
  postInfo: {
    flexGrow: 1,
    minWidth: 0,
  },
  karmaDisplay: {
    marginLeft: 6,
    marginRight: 8,
  },
  postTitle: {
    marginBottom: 4,
    fontSize: 16,
    fontWeight: 600,
    display: "block",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  commentCount: {
    alignSelf: "flex-start",
    color: theme.palette.grey[600],
    display: "flex",
    gap: "4px",
    "& svg": {
      fontSize: 18,
    },
  },
  excerptBottomMargin: {
    marginBottom: 16,
  },
});

const getItemProps = (
  post: PostsRecentDiscussion,
  comments: CommentsList[] = [],
): EARecentDiscussionItemProps => {
  if (!comments?.length) {
    // It's a new event
    if (post.isEvent) {
      return {
        icon: "Calendar",
        iconVariant: "grey",
        user: post.user,
        action: "scheduled",
        post,
        timestamp: post.postedAt,
      };
    }

    // We're displaying the post as a new post
    return {
      icon: post.question ? "Q" : "DocumentFilled",
      iconVariant: "grey",
      user: post.user,
      action: "posted",
      post,
      timestamp: post.postedAt,
    };
  }

  // We're displaying the new comments on the post
  return {
    icon: "CommentFilled",
    iconVariant: "primary",
    user: comments[0].user,
    action: "commented on",
    post,
    timestamp: comments[0].postedAt,
  };
}

/**
 * This component handles entries in recent discussions for new posts, new
 * comments on posts, and new events. See `getItemProps` for the logic deciding
 * which variant we choose.
 */
const EARecentDiscussionThreadInner = ({
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
  classes: ClassesType<typeof styles>,
}) => {
  const {
    isSkippable,
    expandAllThreads,
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

  const {
    EARecentDiscussionItem, EAPostMeta, ForumIcon, CommentsNode,
    PostExcerpt, LinkPostMessage, EAKarmaDisplay, PostsTitle,
  } = Components;
  return (
    <EARecentDiscussionItem {...getItemProps(post, comments)}>
      <div className={classes.header}>
        {!post.isEvent &&
          <EAKarmaDisplay post={post} className={classes.karmaDisplay} />
        }
        <div className={classes.postInfo}>
          <PostsTitle
            post={post}
            read={post.isRead ?? undefined}
            className={classes.postTitle}
            linkEventProps={{intent: 'expandPost'}}
          />
          <EAPostMeta post={post} useEventStyles />
        </div>
        {!post.isEvent &&
          <Link to={postGetCommentsUrl(post)} className={classes.commentCount}>
            <ForumIcon icon="Comment" />
            {post.commentCount ?? 0}
          </Link>
        }
      </div>
      {post.url &&
        <LinkPostMessage post={post} />
      }
      <PostExcerpt
        post={post}
        lines={comments?.length ? 3 : 10}
        useCustomHighlight={false}
        className={classNames({
          [classes.excerptBottomMargin]: nestedComments.length,
        })}
      />
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

export const EARecentDiscussionThread = registerComponent(
  "EARecentDiscussionThread",
  EARecentDiscussionThreadInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    EARecentDiscussionThread: typeof EARecentDiscussionThread,
  }
}
