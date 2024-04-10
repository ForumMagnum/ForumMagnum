import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
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
  {item}: CommentTreeNode<CommentsListWithTopLevelComment>,
): EARecentDiscussionItemProps => {
  return item.parentCommentId
    ? {
      // We have comments on a quick take
      icon: "CommentFilled",
      iconVariant: "primary",
      user: item.user,
      action: "commented on",
      postTitleOverride: `${post.user?.displayName}'s quick take`,
      postUrlOverride: commentGetPageUrlFromIds({
        commentId: item.topLevelCommentId ?? item._id,
        postId: post._id,
        postSlug: post.slug,
      }),
      post,
      timestamp: item.postedAt,
    }
    : {
      // We have a new quick take without comments yet
      icon: "CommentFilled",
      iconVariant: "grey",
      user: post.user,
      action: "posted a",
      postTitleOverride: "Quick Take",
      postUrlOverride: commentGetPageUrlFromIds({
        commentId: item._id,
        postId: post._id,
        postSlug: post.slug,
      }),
      post,
      timestamp: item.postedAt,
    };
}

type NestedComments = CommentTreeNode<CommentsListWithTopLevelComment>;

const splitByTopLevelComment = (nodes: NestedComments[]): NestedComments[][] => {
  const result: Record<string, NestedComments[]> = {};
  for (const node of nodes) {
    if (result[node.item.topLevelCommentId]) {
      result[node.item.topLevelCommentId].push(node);
    } else {
      result[node.item.topLevelCommentId] = [node];
    }
  }
  return Object.values(result);
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

  const splitComments = splitByTopLevelComment(nestedComments);

  const {EARecentDiscussionItem, CommentsItem, CommentsNode} = Components;
  return (
    <>
      {splitComments.map((comments) => {
        if (!comments.length) {
          return null;
        }
        const hasComments = !!comments[0].item.parentCommentId;
        const quickTake = hasComments
          ? comments[0].item.topLevelComment
          : comments[0].item;
        if (!quickTake) {
          return null;
        }
        return (
          <EARecentDiscussionItem
            key={quickTake._id}
            {...getItemProps(post, comments[0])}
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
            {hasComments && comments.map((comment) => (
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
      })}
    </>
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
