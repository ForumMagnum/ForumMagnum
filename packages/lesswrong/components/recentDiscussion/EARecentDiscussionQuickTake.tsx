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
      description: "commented on",
      post: post,
      timestamp: item.postedAt,
    }
    : {
      // We have a new quick take without comments yet
      icon: "CommentFilled",
      iconVariant: "grey",
      user: post.user,
      description: "posted a",
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

  const {EARecentDiscussionItem, CommentsItem, CommentsNode} = Components;
  return (
    <>
      {nestedComments.map((comment) => (
        <EARecentDiscussionItem
          key={comment.item._id}
          {...getItemProps(post, comment)}
        >
          <CommentsItem
            treeOptions={treeOptions}
            comment={comment.item.topLevelComment ?? comment.item}
            nestingLevel={1}
            truncated={false}
            className={classNames(classes.quickTakeBody, {
              [classes.noBottomPadding]: !comment.item.topLevelComment,
            })}
          />
          {comment.item.topLevelComment &&
            <CommentsNode
              treeOptions={{
                ...treeOptions,
                hideParentCommentToggle: true,
              }}
              truncated={false}
              expandAllThreads={expandAllThreads}
              expandNewComments={false}
              nestingLevel={1}
              comment={comment.item}
              childComments={comment.children}
            />
          }
        </EARecentDiscussionItem>
      ))}
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
