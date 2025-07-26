import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useRecentDiscussionThread } from "./useRecentDiscussionThread";
import { commentGetPageUrlFromIds } from "../../lib/collections/comments/helpers";
import type { CommentTreeNode } from "../../lib/utils/unflatten";
import EARecentDiscussionItem, { EARecentDiscussionItemProps } from "./EARecentDiscussionItem";
import classNames from "classnames";
import CommentsItem from "../comments/CommentsItem/CommentsItem";
import CommentsNodeInner from "../comments/CommentsNode";
import { maybeDate } from "@/lib/utils/dateUtils";
import { AnalyticsContext } from "../../lib/analyticsEvents";

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
      timestamp: maybeDate(item.postedAt),
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
      timestamp: maybeDate(item.postedAt),
    };
}

type NestedComments = CommentTreeNode<CommentsListWithTopLevelComment>;

const splitByTopLevelComment = (nodes: NestedComments[]): NestedComments[][] => {
  const result: Record<string, NestedComments[]> = {};
  for (const node of nodes) {
    if (node.item.topLevelCommentId) {
      if (result[node.item.topLevelCommentId]) {
        result[node.item.topLevelCommentId].push(node);
      } else {
        result[node.item.topLevelCommentId] = [node];
      }
    }
  }
  return Object.values(result);
}

const EARecentDiscussionQuickTake = ({
  post,
  comments,
  refetch,
  expandAllThreads: initialExpandAllThreads,
  index,
  classes,
}: {
  post: ShortformRecentDiscussion,
  comments?: CommentsListWithTopLevelComment[],
  refetch: () => void,
  expandAllThreads?: boolean,
  index?: number,
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

  const splitComments = splitByTopLevelComment(nestedComments);
  return (
    <>
      {splitComments.map((comments, splitIndex) => {
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
          <AnalyticsContext key={quickTake._id} feedCardIndex={index}>
          <EARecentDiscussionItem
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
              <CommentsNodeInner
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
          </AnalyticsContext>
        );
      })}
    </>
  );
}

export default registerComponent(
  "EARecentDiscussionQuickTake",
  EARecentDiscussionQuickTake,
  {styles},
);


