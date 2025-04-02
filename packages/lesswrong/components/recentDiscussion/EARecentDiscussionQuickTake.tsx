import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useRecentDiscussionThread } from "./useRecentDiscussionThread";
import { commentGetPageUrlFromIds } from "../../lib/collections/comments/helpers";
import type { CommentTreeNode } from "../../lib/utils/unflatten";
import type { EARecentDiscussionItemProps } from "./EARecentDiscussionItem";
import classNames from "classnames";

const styles = (_theme: ThemeType) => ({
  quickTakeBody: {
    padding: 0,
    "& .CommentsItemMeta-root": {
      paddingTop: 0,
      "& .CommentsItemMeta-rightSection": {
        top: 0,
      },
    },
  },
  noBottomPadding: {
    "& .CommentsItem-bottom": {
      paddingBottom: 0,
    },
  },
});

const getItemProps = (
  post: PostsRecentDiscussion,
  comment: CommentsListWithTopLevelComment,
): EARecentDiscussionItemProps => {
  return comment.parentCommentId
    ? {
      // We have comments on a quick take
      icon: "CommentFilled",
      iconVariant: "primary",
      user: comment.user,
      action: "commented on",
      postTitleOverride: `${post.user?.displayName}'s quick take`,
      postUrlOverride: commentGetPageUrlFromIds({
        commentId: comment.topLevelCommentId ?? comment._id,
        postId: post._id,
        postSlug: post.slug,
      }),
      post,
      timestamp: comment.postedAt,
    }
    : {
      // We have a new quick take without comments yet
      icon: "CommentFilled",
      iconVariant: "grey",
      user: post.user,
      action: "posted a",
      postTitleOverride: "Quick Take",
      postUrlOverride: commentGetPageUrlFromIds({
        commentId: comment._id,
        postId: post._id,
        postSlug: post.slug,
      }),
      post,
      timestamp: comment.postedAt,
    };
}

type NestedComments = CommentTreeNode<CommentsListWithTopLevelComment>;

const groupByQuickTake = (nodes: NestedComments[]): Record<string, NestedComments[]> => {
  const result: Record<string, NestedComments[]> = {};
  for (const node of nodes) {
    // If this comment has no topLevelCommentId, then it must be a quick take.
    // Make sure to separate it from other quick takes.
    const id = node.item.topLevelCommentId ?? node.item._id
    if (result[id]) {
      result[id].push(node);
    } else {
      result[id] = [node];
    }
  }
  return result
}

const EARecentDiscussionQuickTake = ({
  post,
  comments,
  refetch,
  expandAllThreads: initialExpandAllThreads,
  classes,
}: {
  post: ShortformRecentDiscussion,
  comments?: CommentsListWithTopLevelComment[],
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

  // Quick takes are comments, so if we have no comments then there is nothing to display
  if (isSkippable || !comments || !comments.length) {
    return null;
  }
  
  // It's possible for the comments prop to include comments over multiple quick takes,
  // because it's a list of the most recent comments on the *post*.
  const splitComments = groupByQuickTake(nestedComments);
  // To reduce clutter in "Recent discussion", for now we are only going to display
  // the quick take which was last posted / commented on.
  const quickTakeId = comments[0].topLevelCommentId ?? comments[0]._id
  const commentsToDisplay = splitComments[quickTakeId]

  const {EARecentDiscussionItem, CommentsItem, CommentsNode} = Components;
  
  if (!commentsToDisplay.length) {
    return null;
  }
  
  // Find the most recently posted comment that's related to the current quick take
  const latestComment = comments.filter(c => [c._id, c.topLevelCommentId].includes(quickTakeId))[0]
  // If the most recently posted comment has a parentCommentId,
  // that means it's a reply to the quick take, so make sure
  // to display the comments under the quick take.
  const hasComments = !!latestComment.parentCommentId;
  const quickTake = hasComments
    ? latestComment.topLevelComment
    : commentsToDisplay[0].item;

  if (!quickTake) {
    return null;
  }
  
  // Create a comment tree that excludes the quick take itself,
  // so we don't duplicate the quick take when displaying the replies
  let replies: CommentTreeNode<CommentsListWithTopLevelComment>[] = []
  commentsToDisplay.forEach(comment => {
    if (!comment.item.topLevelCommentId) {
      replies = replies.concat(comment.children)
    } else {
      replies.push(comment)
    }
  })

  return (
    <EARecentDiscussionItem
      key={quickTake._id}
      {...getItemProps(post, latestComment)}
    >
      <CommentsItem
        treeOptions={treeOptions}
        comment={quickTake}
        nestingLevel={1}
        truncated={false}
        excerptLines={(quickTake.descendentCount ?? 0) > 1 ? 3 : 20}
        className={classNames(classes.quickTakeBody, {
          [classes.noBottomPadding]: !hasComments,
        })}
      />
      {hasComments && replies.map((comment) => (
        <CommentsNode
          key={comment.item._id}
          treeOptions={{
            ...treeOptions,
            hideParentCommentToggleForTopLevel: true,
          }}
          truncated={false}
          expandAllThreads={expandAllThreads}
          expandNewComments={false}
          nestingLevel={1}
          comment={comment.item}
          childComments={comment.children}
        />
      ))}
    </EARecentDiscussionItem>
  );
}

const EARecentDiscussionQuickTakeComponent = registerComponent(
  "EARecentDiscussionQuickTake",
  EARecentDiscussionQuickTake,
  {styles},
);

declare global {
  interface ComponentTypes {
    EARecentDiscussionQuickTake: typeof EARecentDiscussionQuickTakeComponent,
  }
}
