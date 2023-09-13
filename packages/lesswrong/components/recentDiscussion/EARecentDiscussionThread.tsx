import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { Link } from "../../lib/reactRouterWrapper";
import { useRecentDiscussionThread } from "./useRecentDiscussionThread";
import {
  postGetCommentsUrl,
  postGetPageUrl,
} from "../../lib/collections/posts/helpers";
import { commentGetPageUrlFromIds } from "../../lib/collections/comments/helpers";
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
  newQuickTake: {
    padding: 0,
    "& .CommentsItemMeta-root": {
      paddingTop: 0,
    },
    "& .CommentsItem-bottom": {
      paddingBottom: 0,
    },
  },
});

const isNewQuickTake = (
  post: PostsRecentDiscussion,
  comments: CommentsList[] = [],
) =>
  post.shortform && comments.length === 1 && !comments[0].parentCommentId;

const getItemProps = (
  post: PostsRecentDiscussion,
  comments: CommentsList[] = [],
): EARecentDiscussionItemProps => {
  if (post.isEvent) {
    // It's a new event
    return {
      icon: "Calendar",
      iconVariant: "grey",
      user: post.user,
      description: "scheduled",
      post,
      timestamp: post.postedAt,
    };
  }

  if (isNewQuickTake(post, comments)) {
    // The user posted a new quick take
    return {
      icon: "CommentFilled",
      iconVariant: "grey",
      user: post.user,
      description: "posted a",
      postTitleOverride: "Quick Take",
      postUrlOverride: commentGetPageUrlFromIds({
        commentId: comments[0]._id,
        postId: post._id,
        postSlug: post.slug,
      }),
      post,
      timestamp: comments[0].postedAt,
    };
  }

  if (post.shortform) {
    // Display comments left on a quick take
    // TODO
  }

  if (!comments?.length) {
    // We're displaying the post as a new post
    return {
      icon: "DocumentFilled",
      iconVariant: "grey",
      user: post.user,
      description: "posted",
      post,
      timestamp: post.postedAt,
    };
  }

  // We're displaying the new comments on the post
  return {
    icon: "CommentFilled",
    iconVariant: "primary",
    user: comments[0].user,
    description: "commented on",
    post,
    timestamp: comments[0].postedAt,
  };
}

/**
 * This component handles entries in recent discussions for new posts, new
 * comments on posts, new quick takes and new events. See `getItemProps` for
 * the logic deciding which variant we choose.
 */
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
    EARecentDiscussionItem, EAPostMeta, ForumIcon, CommentsNode, CommentsItem,
    PostsItemTooltipWrapper, PostExcerpt, LinkPostMessage, EAKarmaDisplay,
  } = Components;

  if (isNewQuickTake(post, comments)) {
    const quickTake = comments![0];
    return (
      <EARecentDiscussionItem {...getItemProps(post, comments)}>
        <CommentsItem
          treeOptions={treeOptions}
          comment={quickTake}
          nestingLevel={1}
          truncated={false}
          className={classes.newQuickTake}
        />
      </EARecentDiscussionItem>
    );
  }

  return (
    <EARecentDiscussionItem {...getItemProps(post, comments)}>
      <div className={classes.header}>
        {!post.isEvent &&
          <EAKarmaDisplay post={post} className={classes.karmaDisplay} />
        }
        <div className={classes.postInfo}>
          <PostsItemTooltipWrapper post={post}>
            <Link to={postGetPageUrl(post)} className={classes.postTitle}>
              {post.title}
            </Link>
          </PostsItemTooltipWrapper>
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
